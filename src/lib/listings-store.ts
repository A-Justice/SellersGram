"use client";

import {
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { SEED_LISTINGS } from "@/data/seed";
import type { Listing, ListingStatus, Seller } from "@/data/types";
import { db, auth } from "@/lib/firebase";
import { isOwnerUid } from "@/lib/owner";
import { notifyUser } from "@/lib/notifications-store";

function sellerIdOf(listing: Listing) {
  return listing.sellerId || listing.seller.id;
}

function sellerIdFromSnap(item: QueryDocumentSnapshot<DocumentData>) {
  const data = item.data();
  return String(data.sellerId || (data.seller as Seller | undefined)?.id || item.ref.parent.parent?.id || "");
}

function isFlatListingData(data: Record<string, unknown>) {
  return Boolean(data.title && data.status);
}

function listingRef(sellerId: string, listingId: string) {
  if (!db) throw new Error("Firebase is not connected.");
  return doc(db, "listings", sellerId, "ads", listingId);
}

function sellerFolderRef(sellerId: string) {
  if (!db) throw new Error("Firebase is not connected.");
  return doc(db, "listings", sellerId);
}

function toListing(id: string, data: Record<string, unknown>, sellerId?: string): Listing {
  const seller = (data.seller as Seller) || {
    id: String(data.sellerId || sellerId || ""),
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
    sellerId: String(data.sellerId || seller.id || sellerId || ""),
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

async function ensureSellerFolder(listing: Listing) {
  const sellerId = sellerIdOf(listing);
  await setDoc(
    sellerFolderRef(sellerId),
    {
      sellerId,
      name: listing.seller.name,
      phone: listing.seller.phone || "",
      city: listing.seller.city || listing.city,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

let migrated = false;
let migrateInFlight: Promise<void> | null = null;

async function migrateFlatListings() {
  if (!db || migrated) return;
  if (migrateInFlight) return migrateInFlight;
  const firestore = db;

  migrateInFlight = (async () => {
    const top = await getDocs(collection(firestore, "listings"));
    let remaining = 0;
    for (const item of top.docs) {
      const data = item.data() as Record<string, unknown>;
      if (!isFlatListingData(data)) continue;
      const listing = toListing(item.id, data);
      const sellerId = sellerIdOf(listing);
      if (!sellerId) continue;
      try {
        await ensureSellerFolder(listing);
        await setDoc(listingRef(sellerId, listing.id), toDoc(listing), { merge: true });
        await deleteDoc(item.ref);
      } catch {
        remaining += 1;
      }
    }
    if (remaining === 0) migrated = true;
  })().finally(() => {
    migrateInFlight = null;
  });

  return migrateInFlight;
}

export async function fetchListings(): Promise<Listing[]> {
  if (!db) return [];
  const snap = await getDocs(collectionGroup(db, "ads"));
  return snap.docs.map((item) => toListing(item.id, item.data(), sellerIdFromSnap(item)));
}

export function subscribeListings(onChange: (listings: Listing[]) => void): Unsubscribe {
  if (!db) {
    onChange([]);
    return () => undefined;
  }

  const nested = new Map<string, Listing>();
  const flat = new Map<string, Listing>();

  const publish = () => {
    const merged = new Map(flat);
    for (const [id, listing] of nested) merged.set(id, listing);
    onChange([...merged.values()]);
  };

  void migrateFlatListings();

  const unsubNested = onSnapshot(collectionGroup(db, "ads"), (snap) => {
    nested.clear();
    for (const item of snap.docs) {
      nested.set(item.id, toListing(item.id, item.data(), sellerIdFromSnap(item)));
    }
    publish();
  });

  const unsubFlat = onSnapshot(collection(db, "listings"), (snap) => {
    flat.clear();
    for (const item of snap.docs) {
      const data = item.data() as Record<string, unknown>;
      if (!isFlatListingData(data)) continue;
      flat.set(item.id, toListing(item.id, data));
    }
    publish();
  });

  return () => {
    unsubNested();
    unsubFlat();
  };
}

export async function upsertListing(listing: Listing) {
  if (!db) throw new Error("Firebase is not connected.");
  const sellerId = sellerIdOf(listing);
  await ensureSellerFolder(listing);
  await setDoc(listingRef(sellerId, listing.id), toDoc(listing), { merge: true });
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

  if (status === "live" || status === "rejected") {
    const sellerId = current.sellerId || current.seller.id;
    await notifyUser({
      userId: sellerId,
      title: status === "live" ? "Your ad is live" : "Your ad was not approved",
      body:
        status === "live"
          ? `${current.title} is now visible to buyers.`
          : extra.rejectReason || current.title,
      href: `/listing/${current.id}`,
      type: "listing",
    });
  }
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

export async function deleteListing(listing: Listing, idToken: string) {
  if (!db) throw new Error("Firebase is not connected.");

  const photos = await fetch("/api/uploads/delete", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      urls: listing.photoUrls,
      sellerId: sellerIdOf(listing),
    }),
  });
  if (!photos.ok) {
    const payload = (await photos.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error || "Could not delete photos.");
  }

  const threads = await getDocs(
    query(collection(db, "threads"), where("listingId", "==", listing.id)),
  );
  for (const thread of threads.docs) {
    const messages = await getDocs(collection(db, "threads", thread.id, "messages"));
    const refs = [...messages.docs.map((message) => message.ref), thread.ref];
    for (let i = 0; i < refs.length; i += 450) {
      const batch = writeBatch(db);
      for (const ref of refs.slice(i, i + 450)) batch.delete(ref);
      await batch.commit();
    }
  }

  const reports = await getDocs(
    query(collection(db, "reports"), where("listingId", "==", listing.id)),
  );
  if (!reports.empty) {
    const reportBatch = writeBatch(db);
    for (const report of reports.docs) reportBatch.delete(report.ref);
    await reportBatch.commit();
  }

  const sellerId = sellerIdOf(listing);
  await deleteDoc(listingRef(sellerId, listing.id));
  try {
    await deleteDoc(doc(db, "listings", listing.id));
  } catch {
    // Already nested; leftover flat copy may not exist.
  }
}

export async function seedOwnerListings(user: {
  uid: string;
  name: string;
  phone: string;
}) {
  if (!db || !isOwnerUid(user.uid) || !auth?.currentUser) return;

  await migrateFlatListings();

  const ads = await getDocs(collectionGroup(db, "ads"));
  const mine = ads.docs.filter((item) => sellerIdFromSnap(item) === user.uid);
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

  if (mine.length) {
    if (!payload.azure || !payload.photos) return;
    const batch = writeBatch(db);
    for (const item of mine) {
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
  batch.set(
    sellerFolderRef(user.uid),
    {
      sellerId: user.uid,
      name: user.name,
      phone: user.phone || "",
      city: "Accra",
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  for (const listing of SEED_LISTINGS) {
    const next: Listing = {
      ...listing,
      photoUrls: payload.photos?.[listing.id] || listing.photoUrls,
      sellerId: user.uid,
      seller: { ...seller, city: listing.city },
    };
    batch.set(listingRef(user.uid, listing.id), toDoc(next));
  }
  await batch.commit();
}
