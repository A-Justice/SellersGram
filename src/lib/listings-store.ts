"use client";

import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  writeBatch,
  type Unsubscribe,
} from "firebase/firestore";
import { SEED_LISTINGS } from "@/data/seed";
import type { Listing, ListingStatus, Seller } from "@/data/types";
import { db, auth } from "@/lib/firebase";
import { isOwnerUid } from "@/lib/owner";

function sellerIdOf(listing: Listing) {
  return listing.sellerId || listing.seller.id;
}

function toListing(id: string, data: Record<string, unknown>): Listing {
  const seller = (data.seller as Seller) || {
    id: String(data.sellerId || ""),
    name: "Seller",
    phone: "",
    joinedYear: new Date().getFullYear(),
    rating: 0,
    reviewCount: 0,
    verified: false,
    city: "",
  };

  return {
    id,
    title: String(data.title || ""),
    description: String(data.description || ""),
    priceGhs: (data.priceGhs as number | null) ?? null,
    negotiable: Boolean(data.negotiable),
    contactForPrice: Boolean(data.contactForPrice),
    categoryId: String(data.categoryId || ""),
    subcategoryId: String(data.subcategoryId || ""),
    condition: data.condition === "new" ? "new" : "used",
    regionId: String(data.regionId || ""),
    city: String(data.city || ""),
    photoUrls: Array.isArray(data.photoUrls) ? (data.photoUrls as string[]) : [],
    sellerId: String(data.sellerId || seller.id),
    seller,
    status: (data.status as ListingStatus) || "pending",
    rejectReason: data.rejectReason ? String(data.rejectReason) : undefined,
    boostedUntil: data.boostedUntil ? String(data.boostedUntil) : null,
    createdAt: String(data.createdAt || new Date().toISOString()),
    publishedAt: data.publishedAt ? String(data.publishedAt) : null,
  };
}

function toDoc(listing: Listing) {
  return {
    title: listing.title,
    description: listing.description,
    priceGhs: listing.priceGhs,
    negotiable: listing.negotiable,
    contactForPrice: listing.contactForPrice,
    categoryId: listing.categoryId,
    subcategoryId: listing.subcategoryId,
    condition: listing.condition,
    regionId: listing.regionId,
    city: listing.city,
    photoUrls: listing.photoUrls,
    sellerId: sellerIdOf(listing),
    seller: listing.seller,
    status: listing.status,
    rejectReason: listing.rejectReason || null,
    boostedUntil: listing.boostedUntil,
    createdAt: listing.createdAt,
    publishedAt: listing.publishedAt,
    updatedAt: serverTimestamp(),
  };
}

export async function fetchListings(): Promise<Listing[]> {
  if (!db) return [];
  const snap = await getDocs(collection(db, "listings"));
  return snap.docs.map((item) => toListing(item.id, item.data()));
}

export function subscribeListings(onChange: (listings: Listing[]) => void): Unsubscribe {
  if (!db) {
    onChange([]);
    return () => undefined;
  }
  return onSnapshot(collection(db, "listings"), (snap) => {
    onChange(snap.docs.map((item) => toListing(item.id, item.data())));
  });
}

export async function upsertListing(listing: Listing) {
  if (!db) throw new Error("Firebase is not connected.");
  await setDoc(doc(db, "listings", listing.id), toDoc(listing), { merge: true });
  return listing;
}

export async function setListingStatus(
  listings: Listing[],
  id: string,
  status: ListingStatus,
  extra: Partial<Listing> = {},
) {
  const current = listings.find((listing) => listing.id === id);
  if (!current) return;
  await upsertListing({
    ...current,
    ...extra,
    status,
    publishedAt:
      status === "live"
        ? extra.publishedAt || current.publishedAt || new Date().toISOString()
        : current.publishedAt,
  });
}

export async function boostListing(listings: Listing[], id: string, days: number) {
  const current = listings.find((listing) => listing.id === id);
  if (!current) return;
  const from =
    current.boostedUntil && new Date(current.boostedUntil) > new Date()
      ? new Date(current.boostedUntil)
      : new Date();
  from.setDate(from.getDate() + days);
  await upsertListing({ ...current, boostedUntil: from.toISOString() });
}

export async function createListing(
  input: Omit<Listing, "id" | "status" | "boostedUntil" | "createdAt" | "publishedAt">,
) {
  const listing: Listing = {
    ...input,
    id: `ad-${Date.now()}`,
    sellerId: input.sellerId || input.seller.id,
    status: "pending",
    boostedUntil: null,
    createdAt: new Date().toISOString(),
    publishedAt: null,
  };
  await upsertListing(listing);
  return listing;
}

export async function seedOwnerListings(user: {
  uid: string;
  name: string;
  phone: string;
}) {
  if (!db || !isOwnerUid(user.uid) || !auth?.currentUser) return;

  const existing = await getDocs(collection(db, "listings"));
  const token = await auth.currentUser.getIdToken();
  const response = await fetch("/api/bootstrap-photos", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload = (await response.json()) as {
    photos?: Record<string, string[]>;
    azure?: boolean;
    error?: string;
  };
  if (!response.ok) {
    throw new Error(payload.error || "Could not prepare listing photos.");
  }

  const seller: Seller = {
    id: user.uid,
    name: user.name,
    phone: user.phone || "",
    joinedYear: new Date().getFullYear(),
    rating: 5,
    reviewCount: 0,
    verified: true,
    city: "Accra",
  };

  if (!existing.empty) {
    if (!payload.azure || !payload.photos) return;
    const batch = writeBatch(db);
    for (const item of existing.docs) {
      const urls = payload.photos[item.id];
      if (!urls?.length) continue;
      const current = item.data().photoUrls as string[] | undefined;
      const stillRemote = current?.some((url) => url.includes("unsplash.com"));
      if (!stillRemote) continue;
      batch.set(item.ref, { photoUrls: urls, sellerId: user.uid, seller }, { merge: true });
    }
    await batch.commit();
    return;
  }

  const batch = writeBatch(db);
  for (const listing of SEED_LISTINGS) {
    const next: Listing = {
      ...listing,
      photoUrls: payload.photos?.[listing.id] || listing.photoUrls,
      sellerId: user.uid,
      seller: { ...seller, city: listing.city },
    };
    batch.set(doc(db, "listings", listing.id), toDoc(next));
  }
  await batch.commit();
}
