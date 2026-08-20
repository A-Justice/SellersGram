"use client";

import { ListingEngagementStats } from "@/components/ListingEngagementStats";
import { DeleteAdButton } from "@/components/DeleteAdButton";
import { PageSkeleton } from "@/components/PageSkeleton";
import { RemoteImage } from "@/components/RemoteImage";
import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { setListingStatus } from "@/lib/listings-store";
import { boostDaysLeft, formatGhs, isBoosted } from "@/lib/format";
import { searchListings } from "@/lib/search";
import { useListings } from "@/lib/use-listings";

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
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl tracking-tight">My ads</h1>
        <p className="mt-2 text-sm text-muted">
          Edit, mark sold, boost, or delete an ad.
        </p>
      </div>
      {posted && (
        <p className="rounded-2xl bg-accent/10 px-4 py-3 text-sm text-accent-dark">
          Sent for review. You will see it live after an admin approves it.
        </p>
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
          <li
            key={listing.id}
            className="flex gap-4 rounded-[24px] bg-paper p-3 shadow-[0_0_0_1px_var(--color-line)]"
          >
            <span className="relative h-24 w-20 shrink-0 overflow-hidden rounded-2xl bg-line">
              <RemoteImage src={listing.photoUrls[0] || ""} alt="" className="object-cover" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{listing.title}</p>
              <p className="text-sm text-muted">
                {formatGhs(listing.priceGhs)} · {listing.status}
                {isBoosted(listing) ? ` · Top · ${boostDaysLeft(listing)}d left` : ""}
              </p>
              <ListingEngagementStats
                viewCount={listing.viewCount}
                callInterestCount={listing.callInterestCount}
                className="mt-1"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <Link href={`/listing/${listing.id}`} className="text-sm text-accent">
                  View
                </Link>
                {listing.status === "live" && (
                  <>
                    <Link href={`/boost/${listing.id}`} className="text-sm text-accent">
                      Boost
                    </Link>
                    <button
                      type="button"
                      className="text-sm text-muted"
                      onClick={() => {
                        void setListingStatus(listings, listing.id, "sold");
                      }}
                    >
                      Mark sold
                    </button>
                  </>
                )}
                <DeleteAdButton listing={listing} />
              </div>
            </div>
          </li>
        ))}
      </ul>
      {!mine.length && (
        <p className="text-sm text-muted">You have not posted yet.</p>
      )}
      {mine.length > 0 && !filtered.length && (
        <p className="text-sm text-muted">No ads match your search.</p>
      )}
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
