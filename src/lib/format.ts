import type { Listing } from "@/data/types";

export function formatGhs(amount: number | null) {
  if (amount == null) return "Contact for price";
  return `GH₵ ${amount.toLocaleString("en-GH")}`;
}

export function timeAgo(iso: string) {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export function isBoosted(listing: Pick<Listing, "boostedUntil">) {
  return Boolean(
    listing.boostedUntil && new Date(listing.boostedUntil).getTime() > Date.now(),
  );
}

export function boostDaysLeft(listing: Pick<Listing, "boostedUntil">) {
  if (!isBoosted(listing) || !listing.boostedUntil) return 0;
  return Math.ceil(
    (new Date(listing.boostedUntil).getTime() - Date.now()) / 86400000,
  );
}

export function sortListings(listings: Listing[]) {
  return [...listings].sort((a, b) => {
    const aTop = isBoosted(a) ? 1 : 0;
    const bTop = isBoosted(b) ? 1 : 0;
    if (aTop !== bTop) return bTop - aTop;
    return (
      new Date(b.publishedAt || b.createdAt).getTime() -
      new Date(a.publishedAt || a.createdAt).getTime()
    );
  });
}

export function daysFromNow(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}
