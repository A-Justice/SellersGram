"use client";

import { RemoteImage } from "@/components/RemoteImage";
import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { setListingStatus } from "@/lib/listings-store";
import { boostDaysLeft, formatGhs, isBoosted } from "@/lib/format";
import { useListings } from "@/lib/use-listings";

function MyAds() {
  const { user } = useAuth();
  const { listings } = useListings();
  const posted = useSearchParams().get("posted");
  const mine = listings.filter((listing) => {
    if (!user) return false;
    return listing.sellerId === user.uid || listing.seller.id === user.uid;
  });

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
          Edit, mark sold, or boost a live ad.
        </p>
      </div>
      {posted && (
        <p className="rounded-2xl bg-accent/10 px-4 py-3 text-sm text-accent-dark">
          Sent for review. You will see it live after an admin approves it.
        </p>
      )}
      <ul className="space-y-3">
        {mine.map((listing) => (
          <li
            key={listing.id}
            className="flex gap-4 rounded-[24px] bg-paper p-3 shadow-[0_0_0_1px_var(--color-line)]"
          >
            <span className="relative h-24 w-20 shrink-0 overflow-hidden rounded-2xl bg-line">
              {listing.photoUrls[0] && (
                <RemoteImage src={listing.photoUrls[0]} alt="" className="object-cover" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{listing.title}</p>
              <p className="text-sm text-muted">
                {formatGhs(listing.priceGhs)} · {listing.status}
                {isBoosted(listing) ? ` · Top · ${boostDaysLeft(listing)}d left` : ""}
              </p>
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
              </div>
            </div>
          </li>
        ))}
      </ul>
      {!mine.length && (
        <p className="text-sm text-muted">You have not posted yet.</p>
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
