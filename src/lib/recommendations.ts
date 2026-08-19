import type { Listing, UserInterest } from "@/data/types";
import { isBoosted } from "@/lib/format";

const DEFAULT_LIMIT = 5;

function isOwnListing(listing: Listing, uid?: string) {
  if (!uid) return false;
  return listing.sellerId === uid || listing.seller.id === uid;
}

function stableRank(id: string, salt: string) {
  let hash = 0;
  const key = `${salt}:${id}`;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function pickUnique(
  target: Listing[],
  source: Listing[],
  used: Set<string>,
  limit: number,
) {
  for (const listing of source) {
    if (target.length >= limit) break;
    if (used.has(listing.id)) continue;
    used.add(listing.id);
    target.push(listing);
  }
}

function scoreByInterests(
  listings: Listing[],
  interests: UserInterest[],
  seen: Set<string>,
) {
  const categoryWeight = new Map<string, number>();
  const regionWeight = new Map<string, number>();

  for (const interest of interests) {
    const weight = interest.callInterest ? 3 : 1;
    categoryWeight.set(
      interest.categoryId,
      (categoryWeight.get(interest.categoryId) || 0) + weight,
    );
    regionWeight.set(
      interest.regionId,
      (regionWeight.get(interest.regionId) || 0) + weight,
    );
  }

  return listings
    .map((listing) => {
      const categoryScore = categoryWeight.get(listing.categoryId) || 0;
      let score = categoryScore * 18 + (regionWeight.get(listing.regionId) || 0) * 5;
      if (seen.has(listing.id)) score -= 30;
      if (categoryScore > 0) score += 6;
      score += Math.min(listing.viewCount || 0, 30) * 0.06;
      return { listing, score, categoryScore };
    })
    .filter((item) => item.categoryScore > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.categoryScore - a.categoryScore ||
        (b.listing.viewCount || 0) - (a.listing.viewCount || 0),
    )
    .map((item) => item.listing);
}

export function recommendListings(
  listings: Listing[],
  interests: UserInterest[],
  uid?: string,
  limit = DEFAULT_LIMIT,
): Listing[] {
  const live = listings.filter(
    (listing) => listing.status === "live" && !isOwnListing(listing, uid),
  );
  if (!live.length) return [];

  const target = Math.min(limit, live.length);
  const used = new Set<string>();
  const result: Listing[] = [];
  const seen = new Set(interests.map((item) => item.listingId));

  if (interests.length) {
    pickUnique(result, scoreByInterests(live, interests, seen), used, target);
  }

  if (result.length < target) {
    const boosted = live
      .filter((listing) => isBoosted(listing))
      .sort(
        (a, b) =>
          new Date(b.publishedAt || b.createdAt).getTime() -
          new Date(a.publishedAt || a.createdAt).getTime(),
      );
    pickUnique(result, boosted, used, target);
  }

  if (result.length < target) {
    const salt = uid || "guest";
    const randomPool = [...live]
      .filter((listing) => !used.has(listing.id))
      .sort(
        (a, b) =>
          stableRank(a.id, salt) - stableRank(b.id, salt) ||
          new Date(b.publishedAt || b.createdAt).getTime() -
            new Date(a.publishedAt || a.createdAt).getTime(),
      );
    pickUnique(result, randomPool, used, target);
  }

  return result;
}

export const RECOMMENDED_COUNT = DEFAULT_LIMIT;
