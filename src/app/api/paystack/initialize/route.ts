import { NextResponse } from "next/server";
import { BOOST_PACKAGES } from "@/data/seed";
import { publicEnv } from "@/lib/env";
import { boostPackageById, boostReference } from "@/lib/server/boost";
import { adminDb, adminReady } from "@/lib/server/firebase-admin";
import { initializePaystackTransaction, isPaystackConfigured } from "@/lib/server/paystack";
import { requireUser } from "@/lib/server/require-user";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!isPaystackConfigured()) {
      return NextResponse.json({ error: "Paystack is not configured." }, { status: 501 });
    }
    if (!adminReady()) {
      return NextResponse.json({ error: "Server storage is not configured." }, { status: 501 });
    }

    const user = await requireUser(request);
    const body = (await request.json()) as {
      listingId?: string;
      sellerId?: string;
      packId?: string;
    };

    const listingId = String(body.listingId || "").trim();
    const sellerId = String(body.sellerId || "").trim();
    const packId = String(body.packId || "").trim();
    const pack = boostPackageById(packId);

    if (!listingId || !sellerId || !pack) {
      return NextResponse.json({ error: "Invalid boost request." }, { status: 400 });
    }
    if (user.uid !== sellerId) {
      return NextResponse.json({ error: "You can only boost your own ads." }, { status: 403 });
    }
    if (!BOOST_PACKAGES.some((item) => item.id === packId)) {
      return NextResponse.json({ error: "Unknown boost package." }, { status: 400 });
    }

    const db = adminDb();
    const nested = await db.doc(`listings/${sellerId}/ads/${listingId}`).get();
    const flat = nested.exists ? null : await db.doc(`listings/${listingId}`).get();
    if (!nested.exists && !flat?.exists) {
      return NextResponse.json({ error: "Ad not found." }, { status: 404 });
    }

    const reference = boostReference(listingId);
    const callbackUrl = `${publicEnv.appUrl}/boost/${listingId}/callback`;

    const paystack = await initializePaystackTransaction({
      amountGhs: pack.priceGhs,
      email: user.email || `${user.uid}@vendorsgram.app`,
      reference,
      callbackUrl,
      metadata: {
        listingId,
        sellerId,
        packId,
        days: pack.days,
        uid: user.uid,
      },
    });

    await db.doc(`payments/${reference}`).set({
      reference,
      sellerId,
      listingId,
      packId,
      days: pack.days,
      amountGhs: pack.priceGhs,
      status: "pending",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      authorizationUrl: paystack.authorization_url,
      reference: paystack.reference,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payment failed to start.";
    const status = message === "Not signed in" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
