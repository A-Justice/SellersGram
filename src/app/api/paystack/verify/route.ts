import { NextResponse } from "next/server";
import { applyBoostAfterPayment, boostPackageById } from "@/lib/server/boost";
import { adminReady } from "@/lib/server/firebase-admin";
import { isPaystackConfigured, verifyPaystackTransaction } from "@/lib/server/paystack";
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
    const body = (await request.json()) as { reference?: string };
    const reference = String(body.reference || "").trim();
    if (!reference) {
      return NextResponse.json({ error: "Payment reference is required." }, { status: 400 });
    }

    const payment = await verifyPaystackTransaction(reference);
    if (payment.status !== "success") {
      return NextResponse.json({ error: "Payment was not completed." }, { status: 402 });
    }

    const metadata = payment.metadata || {};
    const listingId = String(metadata.listingId || "");
    const sellerId = String(metadata.sellerId || "");
    const packId = String(metadata.packId || "");
    const days = Number(metadata.days || 0);
    const pack = boostPackageById(packId);

    if (!listingId || !sellerId || !pack || days !== pack.days) {
      return NextResponse.json({ error: "Invalid payment metadata." }, { status: 400 });
    }
    if (user.uid !== sellerId) {
      return NextResponse.json({ error: "This payment belongs to another account." }, { status: 403 });
    }
    if (payment.amount !== Math.round(pack.priceGhs * 100)) {
      return NextResponse.json({ error: "Payment amount does not match the package." }, { status: 400 });
    }

    const result = await applyBoostAfterPayment({
      listingId,
      sellerId,
      days: pack.days,
      reference,
      amountGhs: pack.priceGhs,
      packId,
    });

    return NextResponse.json({
      success: true,
      alreadyApplied: result.alreadyApplied,
      boostedUntil: "boostedUntil" in result ? result.boostedUntil : undefined,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payment verification failed.";
    const status = message === "Not signed in" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
