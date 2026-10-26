import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import type { Listing, ListingStatus, Seller } from "@/data/types";
import { db as clientDb } from "@/lib/firebase";
import { sortListings } from "@/lib/format";
import { adminDb, adminReady } from "@/lib/server/firebase-admin";

function sellerFromData(data: DocumentData, sellerIdFallback: string): Seller {
  const seller = data.seller as Seller | undefined;
  return {
    id: String(seller?.id || data.sellerId || sellerIdFallback || ""),
    name: String(seller?.name || "Seller"),
    phone: String(seller?.phone || ""),
    joinedYear: Number(seller?.joinedYear || new Date().getFullYear()),
    rating: Number(seller?.rating || 0),
    reviewCount: Number(seller?.reviewCount || 0),
    verified: Boolean(seller?.verified),
    city: String(seller?.city || ""),
  };
}

function sellerIdFromPath(path: string) {
  const parts = path.split("/");
  if (parts[0] === "listings" && parts[2] === "ads") return parts[1] || "";
  return "";
}

function toListing(id: string, data: DocumentData, sellerId?: string): Listing {
  const sid = String(data.sellerId || sellerId || "");
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
    videoUrl: data.videoUrl ? String(data.videoUrl) : null,
    attributes:
      data.attributes && typeof data.attributes === "object"
        ? Object.fromEntries(
            Object.entries(data.attributes as Record<string, unknown>)
              .filter(([, val]) => typeof val === "string" && val)
              .map(([key, val]) => [key, String(val)]),
          )
        : undefined,
    sellerId: sid,
    seller: sellerFromData(data, sid),
    status: (data.status as ListingStatus) || "pending",
    rejectReason: data.rejectReason ? String(data.rejectReason) : undefined,
    boostedUntil: data.boostedUntil ? String(data.boostedUntil) : null,
    createdAt: String(data.createdAt || new Date().toISOString()),
    publishedAt: data.publishedAt ? String(data.publishedAt) : null,
    viewCount: typeof data.viewCount === "number" ? data.viewCount : 0,
    callInterestCount:
      typeof data.callInterestCount === "number" ? data.callInterestCount : 0,
  };
}

function looksLikeListing(data: DocumentData | undefined) {
  return Boolean(data?.title && data?.status);
}

function fromSnap(snap: QueryDocumentSnapshot<DocumentData>): Listing {
  return toListing(snap.id, snap.data(), sellerIdFromPath(snap.ref.path));
}

function hasAdminCredentials() {
  return Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim());
}

/** Full ads index — same shape the browser already loads via collectionGroup("ads"). */
let adsIndex: { at: number; byId: Map<string, Listing> } | null = null;
const ADS_INDEX_TTL_MS = 60_000;

async function loadAdsIndexViaClient(): Promise<Map<string, Listing>> {
  if (!clientDb) return new Map();
  if (adsIndex && Date.now() - adsIndex.at < ADS_INDEX_TTL_MS) {
    return adsIndex.byId;
  }

  const byId = new Map<string, Listing>();
  // No status filter — avoids a collection-group single-field exemption that
  // production may not have yet. Matches client subscribeListings().
  const snap = await getDocs(collectionGroup(clientDb, "ads"));
  for (const item of snap.docs) {
    if (!looksLikeListing(item.data())) continue;
    byId.set(item.id, fromSnap(item));
  }

  const flat = await getDocs(collection(clientDb, "listings"));
  for (const item of flat.docs) {
    const data = item.data();
    if (!looksLikeListing(data)) continue;
    if (byId.has(item.id)) continue;
    byId.set(item.id, toListing(item.id, data));
  }

  adsIndex = { at: Date.now(), byId };
  return byId;
}

async function getListingViaClient(listingId: string): Promise<Listing | null> {
  if (!clientDb) return null;

  try {
    const byField = await getDocs(
      query(
        collectionGroup(clientDb, "ads"),
        where("listingId", "==", listingId),
        limit(1),
      ),
    );
    if (!byField.empty) return fromSnap(byField.docs[0]!);
  } catch {
    // Index may be missing.
  }

  try {
    const flat = await getDoc(doc(clientDb, "listings", listingId));
    if (flat.exists() && looksLikeListing(flat.data())) {
      return toListing(listingId, flat.data()!);
    }
  } catch {
    // ignore
  }

  const all = await loadAdsIndexViaClient();
  return all.get(listingId) || null;
}

async function getListingViaAdmin(listingId: string): Promise<Listing | null> {
  if (!hasAdminCredentials() || !adminReady()) return null;
  const db = adminDb();

  try {
    const byField = await db
      .collectionGroup("ads")
      .where("listingId", "==", listingId)
      .limit(1)
      .get();
    if (!byField.empty) {
      const docSnap = byField.docs[0]!;
      return toListing(
        docSnap.id,
        docSnap.data(),
        sellerIdFromPath(docSnap.ref.path),
      );
    }
  } catch {
    // ignore
  }

  try {
    const flat = await db.doc(`listings/${listingId}`).get();
    if (flat.exists && looksLikeListing(flat.data())) {
      return toListing(listingId, flat.data()!);
    }
  } catch {
    // ignore
  }

  try {
    const snap = await db.collectionGroup("ads").get();
    const hit = snap.docs.find((item) => item.id === listingId);
    if (hit && looksLikeListing(hit.data())) {
      return toListing(hit.id, hit.data(), sellerIdFromPath(hit.ref.path));
    }
  } catch {
    // ignore
  }

  return null;
}

/** Resolve a listing by id for SEO / SSR / Open Graph. */
export async function getListingById(id: string): Promise<Listing | null> {
  const listingId = id.trim();
  if (!listingId) return null;

  // Prefer the public client SDK locally (no service account needed).
  try {
    const viaClient = await getListingViaClient(listingId);
    if (viaClient) return viaClient;
  } catch (error) {
    console.error("getListingViaClient failed", listingId, error);
  }

  try {
    return await getListingViaAdmin(listingId);
  } catch (error) {
    console.error("getListingViaAdmin failed", listingId, error);
    return null;
  }
}

export type SitemapListing = {
  id: string;
  updatedAt: string;
};

/** Full live listings for home SSR / sitemap (sorted like the client feed). */
export async function getLiveListings(): Promise<Listing[]> {
  try {
    const all = await loadAdsIndexViaClient();
    return sortListings(
      [...all.values()].filter((listing) => listing.status === "live"),
    );
  } catch (error) {
    console.error("getLiveListings failed", error);
    return [];
  }
}

/** Live ads for sitemap.xml */
export async function getLiveListingsForSitemap(): Promise<SitemapListing[]> {
  try {
    const live = await getLiveListings();
    return live.map((listing) => ({
      id: listing.id,
      updatedAt: listing.publishedAt || listing.createdAt,
    }));
  } catch (error) {
    console.error("getLiveListingsForSitemap failed", error);
    return [];
  }
}
