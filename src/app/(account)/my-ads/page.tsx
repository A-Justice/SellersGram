"use client";

import { ListingEngagementStats } from "@/components/ListingEngagementStats";
import { AccountPageTitle } from "@/components/AccountShell";
import { DeleteAdButton } from "@/components/DeleteAdButton";
import { PageSkeleton } from "@/components/PageSkeleton";
import { RemoteImage } from "@/components/RemoteImage";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Zap } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { Listing } from "@/data/types";
import { setListingStatus } from "@/lib/listings-store";
import { boostDaysLeft, formatGhs, isBoosted } from "@/lib/format";
import { searchListings } from "@/lib/search";
import { markSellerDigestSeen } from "@/lib/seller-digest";
import { useListings } from "@/lib/use-listings";

function statusLabel(status: Listing["status"]) {
  if (status === "live") return "Live";
  if (status === "pending") return "In review";
  if (status === "sold") return "Sold";
  if (status === "rejected") return "Rejected";
  if (status === "hidden") return "Hidden";
  return status;
}

function MyAdRow({
  listing,
  listings,
}: {
  listing: Listing;
  listings: Listing[];
}) {
  const boosted = isBoosted(listing);
  const daysLeft = boosted ? boostDaysLeft(listing) : 0;
  const canBoost = listing.status === "live";

  return (
    <li
      className={`relative overflow-hidden rounded-[24px] p-3 sm:p-3.5 ${
        boosted
          ? "bg-[linear-gradient(135deg,#fffdf8_0%,#fff6df_48%,#fffdf8_100%)] shadow-[0_0_0_1px_rgba(212,160,23,0.55),0_10px_28px_-18px_rgba(212,160,23,0.55)]"
          : "bg-paper shadow-[0_0_0_1px_var(--color-line)]"
      }`}
    >
      {boosted ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-[linear-gradient(180deg,#f0c84a,#d4a017,#a67c00)]"
        />
      ) : null}

      <div className="flex items-stretch gap-3 sm:gap-4">
        <span
          className={`relative h-24 w-20 shrink-0 overflow-hidden rounded-2xl bg-line sm:h-28 sm:w-24 ${
            boosted ? "ring-2 ring-gold/50" : ""
          }`}
        >
          <RemoteImage
            src={listing.photoUrls[0] || ""}
            alt=""
            className="object-cover"
          />
          {boosted ? (
            <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-0.5 rounded-full bg-gold px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink shadow-sm">
              <Zap className="size-2.5 fill-ink" />
              Top
            </span>
          ) : null}
        </span>

        <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-display text-lg leading-snug tracking-tight text-ink">
                {listing.title}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              <span className="font-semibold text-ink">
                {listing.contactForPrice
                  ? "Contact for price"
                  : formatGhs(listing.priceGhs)}
              </span>
              <span className="text-muted">·</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${
                  listing.status === "live"
                    ? "bg-accent/10 text-accent-dark"
                    : listing.status === "sold"
                      ? "bg-canvas text-muted"
                      : "bg-canvas text-muted"
                }`}
              >
                {statusLabel(listing.status)}
              </span>
              {boosted ? (
                <span className="rounded-full bg-gold/25 px-2 py-0.5 text-[11px] font-semibold text-ink">
                  {daysLeft}d left on Top
                </span>
              ) : null}
            </div>

            <ListingEngagementStats
              viewCount={listing.viewCount}
              callInterestCount={listing.callInterestCount}
              className="text-xs"
              showEmpty
            />

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5">
              <Link
                href={`/listing/${listing.id}`}
                className="text-sm font-medium text-accent"
              >
                View
              </Link>
              {listing.status === "live" ? (
                <button
                  type="button"
                  className="text-sm text-muted hover:text-ink"
                  onClick={() => {
                    void setListingStatus(listings, listing.id, "sold");
                  }}
                >
                  Mark sold
                </button>
              ) : null}
              <DeleteAdButton listing={listing} />
            </div>
          </div>

          {canBoost ? (
            <Link
              href={`/boost/${listing.id}`}
              className={`group relative inline-flex h-14 w-full shrink-0 items-center justify-center gap-2 overflow-hidden rounded-2xl px-4 text-sm font-semibold tracking-tight transition sm:h-[4.5rem] sm:w-[7.25rem] sm:flex-col sm:gap-1 ${
                boosted
                  ? "bg-ink text-gold shadow-[0_8px_20px_-10px_rgba(20,17,14,0.65)] hover:bg-ink/90"
                  : "bg-[linear-gradient(145deg,#f6d56a_0%,#d4a017_55%,#b8860b_100%)] text-ink shadow-[0_10px_24px_-12px_rgba(212,160,23,0.9)] hover:brightness-105"
              }`}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-40 [background:linear-gradient(115deg,transparent_35%,rgba(255,255,255,0.55)_48%,transparent_62%)] transition duration-500 group-hover:translate-x-4"
              />
              <Zap
                className={`relative size-5 ${boosted ? "fill-gold text-gold" : "fill-ink text-ink"}`}
              />
              <span className="relative leading-none">
                {boosted ? "Extend" : "Boost"}
              </span>
            </Link>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function MyAds() {
  const { user, loading } = useAuth();
  const { listings } = useListings();
  const [query, setQuery] = useState("");
  const posted = useSearchParams().get("posted");
  const mine = listings.filter((listing) => {
    if (!user) return false;
    return listing.sellerId === user.uid || listing.seller.id === user.uid;
  });
  const filtered = useMemo(
    () => searchListings(mine, query),
    [mine, query],
  );

  useEffect(() => {
    if (!user) return;
    void markSellerDigestSeen(user.uid);
  }, [user]);

  if (loading) return <PageSkeleton />;

  if (!user) {
    return (
      <div className="py-16 text-center">
        <h1 className="font-display text-4xl">Your ads</h1>
        <p className="mt-2 text-sm text-muted">Sign in to manage what you posted.</p>
        <Link href="/login?next=/my-ads" className="mt-5 inline-flex h-11 items-center rounded-full bg-ink px-5 text-paper">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
      <div className="mx-auto w-full max-w-3xl shrink-0 px-4 lg:px-6">
        <AccountPageTitle
          title="My ads"
          subtitle={
            <p className="text-sm text-muted">
              Edit, mark sold, boost, or delete an ad.
            </p>
          }
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto pb-6">
        <div className="mx-auto max-w-3xl space-y-6 px-4 lg:px-6">
          {posted && (
            <div className="space-y-3 rounded-[24px] bg-accent/10 px-4 py-4 shadow-[0_0_0_1px_var(--color-line)]">
              <p className="text-sm text-accent-dark">
                Sent for review. You’ll see it live after an admin approves it.
              </p>
              <Link
                href="/sell"
                className="inline-flex h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-medium text-paper"
              >
                Post another ad
              </Link>
            </div>
          )}
          {mine.length > 0 && (
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search your ads — title, city, live, sold…"
                className="field field-icon"
              />
            </label>
          )}
          <ul className="space-y-3">
            {filtered.map((listing) => (
              <MyAdRow key={listing.id} listing={listing} listings={listings} />
            ))}
          </ul>
          {!mine.length && (
            <p className="text-sm text-muted">You have not posted yet.</p>
          )}
          {mine.length > 0 && !filtered.length && (
            <p className="text-sm text-muted">No ads match your search.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MyAdsPage() {
  return (
    <Suspense>
      <MyAds />
    </Suspense>
  );
}
