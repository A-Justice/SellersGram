import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb, adminReady } from "@/lib/server/firebase-admin";
import { requireUser } from "@/lib/server/require-user";

export const runtime = "nodejs";

type TrackType = "view" | "call_reveal";

async function listingDocRef(sellerId: string, listingId: string) {
  const db = adminDb();
  const nested = db.doc(`listings/${sellerId}/ads/${listingId}`);
  const nestedSnap = await nested.get();
  if (nestedSnap.exists) return nested;

  const flat = db.doc(`listings/${listingId}`);
  const flatSnap = await flat.get();
  if (flatSnap.exists) return flat;

  return null;
}

async function optionalUser(request: Request) {
  try {
    return await requireUser(request);
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    if (!adminReady()) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const body = (await request.json()) as {
      listingId?: string;
      sellerId?: string;
      type?: TrackType;
    };

    const listingId = String(body.listingId || "").trim();
    const sellerId = String(body.sellerId || "").trim();
    const type = body.type;

    if (!listingId || !sellerId || (type !== "view" && type !== "call_reveal")) {
      return NextResponse.json({ error: "Invalid tracking request." }, { status: 400 });
    }

    const listingRef = await listingDocRef(sellerId, listingId);
    if (!listingRef) {
      return NextResponse.json({ error: "Ad not found." }, { status: 404 });
    }

    const field = type === "view" ? "viewCount" : "callInterestCount";
    const pendingField = type === "view" ? "pendingViews" : "pendingCallInterests";
    const db = adminDb();

    await listingRef.set(
      { [field]: FieldValue.increment(1) },
      { merge: true },
    );

    // Accumulate missed engagement for the seller's daily 8am SMS digest.
    await db.doc(`users/${sellerId}`).set(
      {
        [pendingField]: FieldValue.increment(1),
        pendingEngagementUpdatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    // Named viewers: only signed-in people, never the seller themselves.
    if (type === "view") {
      const viewer = await optionalUser(request);
      if (viewer && viewer.uid !== sellerId) {
        const profile = await db.doc(`users/${viewer.uid}`).get();
        const viewerName =
          String(profile.data()?.name || "").trim() ||
          viewer.email?.split("@")[0] ||
          "Vendors Gram user";

        await listingRef.collection("viewers").doc(viewer.uid).set(
          {
            viewerUid: viewer.uid,
            viewerName,
            sellerId,
            listingId,
            lastViewedAt: FieldValue.serverTimestamp(),
            viewCount: FieldValue.increment(1),
          },
          { merge: true },
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tracking failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
