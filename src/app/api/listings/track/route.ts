import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb, adminReady } from "@/lib/server/firebase-admin";

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
    await listingRef.set(
      { [field]: FieldValue.increment(1) },
      { merge: true },
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tracking failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
