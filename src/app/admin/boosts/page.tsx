"use client";

import { BOOST_PACKAGES } from "@/data/seed";
import { formatGhs, isBoosted } from "@/lib/format";
import { useListings } from "@/lib/use-listings";

export default function AdminBoostsPage() {
  const { live } = useListings();
  const boosted = live.filter(isBoosted);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl tracking-tight">Boosts</h1>
        <p className="mt-2 text-sm text-muted">
          Only paid product. Prices can be edited here later from Firestore.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {BOOST_PACKAGES.map((pack) => (
          <div
            key={pack.id}
            className="rounded-[24px] bg-paper p-5 shadow-[0_0_0_1px_var(--color-line)]"
          >
            <p className="font-display text-2xl">{pack.label}</p>
            <p className="mt-1 text-sm text-muted">{formatGhs(pack.priceGhs)}</p>
          </div>
        ))}
      </div>
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">
          Active Top Ads
        </h2>
        {boosted.map((listing) => (
          <p key={listing.id} className="text-sm">
            {listing.title}
          </p>
        ))}
        {!boosted.length && <p className="text-sm text-muted">None right now.</p>}
      </section>
    </div>
  );
}
