import { applyBoostAfterPayment, boostPackageById } from "@/lib/server/boost";
import { verifyPaystackTransaction } from "@/lib/server/paystack";

export type FulfillBoostResult =
  | { ok: true; alreadyApplied: boolean; boostedUntil?: string }
  | { ok: false; error: string; status: number };

/**
 * Re-verify a Paystack reference and apply the boost.
 * Safe to call from the browser callback and from the webhook (idempotent).
 */
export async function fulfillBoostFromReference(
  reference: string,
  options?: { expectedSellerId?: string },
): Promise<FulfillBoostResult> {
  const payment = await verifyPaystackTransaction(reference);
  if (payment.status !== "success") {
    return { ok: false, error: "Payment was not completed.", status: 402 };
  }

  const metadata = payment.metadata || {};
  const listingId = String(metadata.listingId || "");
  const sellerId = String(metadata.sellerId || "");
  const packId = String(metadata.packId || "");
  const days = Number(metadata.days || 0);
  const pack = boostPackageById(packId);

  if (!listingId || !sellerId || !pack || days !== pack.days) {
    return { ok: false, error: "Invalid payment metadata.", status: 400 };
  }
  if (options?.expectedSellerId && options.expectedSellerId !== sellerId) {
    return {
      ok: false,
      error: "This payment belongs to another account.",
      status: 403,
    };
  }
  if (payment.amount !== Math.round(pack.priceGhs * 100)) {
    return {
      ok: false,
      error: "Payment amount does not match the package.",
      status: 400,
    };
  }

  const result = await applyBoostAfterPayment({
    listingId,
    sellerId,
    days: pack.days,
    reference,
    amountGhs: pack.priceGhs,
    packId,
  });

  return {
    ok: true,
    alreadyApplied: result.alreadyApplied,
    boostedUntil: "boostedUntil" in result ? result.boostedUntil : undefined,
  };
}
