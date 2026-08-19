import { FieldValue } from "firebase-admin/firestore";
import { BOOST_PACKAGES } from "@/data/seed";
import type { BoostPackage } from "@/data/types";
import { adminDb } from "@/lib/server/firebase-admin";

export function boostPackageById(packId: string): BoostPackage | undefined {
  return BOOST_PACKAGES.find((pack) => pack.id === packId);
}

export function boostReference(listingId: string) {
  return `vg-boost-${listingId}-${Date.now()}`;
}

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

export async function applyBoostAfterPayment(input: {
  listingId: string;
  sellerId: string;
  days: number;
  reference: string;
  amountGhs: number;
  packId: string;
}) {
  const db = adminDb();
  const paymentRef = db.doc(`payments/${input.reference}`);
  const existing = await paymentRef.get();
  if (existing.exists && existing.data()?.status === "success") {
    return { alreadyApplied: true as const };
  }

  const listingRef = await listingDocRef(input.sellerId, input.listingId);
  if (!listingRef) throw new Error("Ad not found.");

  const listingSnap = await listingRef.get();
  const listing = listingSnap.data() as { boostedUntil?: string | null; title?: string };
  const from =
    listing.boostedUntil && new Date(listing.boostedUntil) > new Date()
      ? new Date(listing.boostedUntil)
      : new Date();
  from.setDate(from.getDate() + input.days);

  const batch = db.batch();
  batch.set(
    listingRef,
    { boostedUntil: from.toISOString() },
    { merge: true },
  );
  batch.set(paymentRef, {
    reference: input.reference,
    sellerId: input.sellerId,
    listingId: input.listingId,
    listingTitle: listing.title || "",
    packId: input.packId,
    days: input.days,
    amountGhs: input.amountGhs,
    status: "success",
    paidAt: FieldValue.serverTimestamp(),
  });
  await batch.commit();

  return { alreadyApplied: false as const, boostedUntil: from.toISOString() };
}
