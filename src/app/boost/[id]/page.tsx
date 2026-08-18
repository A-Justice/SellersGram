"use client";

import { useParams, useRouter } from "next/navigation";
import { BOOST_PACKAGES } from "@/data/seed";
import { useAuth } from "@/context/AuthContext";
import { boostListing } from "@/lib/listings-store";
import { formatGhs, isBoosted } from "@/lib/format";
import { useListings } from "@/lib/use-listings";

export default function BoostPage() {
  const { id } = useParams<{ id: string }>();
  const { listings } = useListings();
  const listing = listings.find((item) => item.id === id);
  const { user } = useAuth();
  const router = useRouter();

  if (!listing) return <p className="py-16 text-center text-muted">Ad not found.</p>;

  async function pay(days: number) {
    await boostListing(listings, listing!.id, days);
    router.push("/my-ads");
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
          Boost
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">Top Ad</h1>
        <p className="mt-2 text-sm text-muted">
          Your ad stays at the top of its category until the boost ends.
        </p>
      </div>
      <div className="rounded-[24px] bg-paper p-5 shadow-[0_0_0_1px_var(--color-line)]">
        <p className="font-medium">{listing.title}</p>
        <p className="text-sm text-muted">
          {isBoosted(listing) ? "Already boosted — buying more extends it." : "Not boosted yet."}
        </p>
      </div>
      <div className="grid gap-3">
        {BOOST_PACKAGES.map((pack) => (
          <button
            key={pack.id}
            type="button"
            disabled={!user}
            onClick={() => pay(pack.days)}
            className="flex items-center justify-between rounded-[24px] bg-paper px-5 py-4 text-left shadow-[0_0_0_1px_var(--color-line)] hover:shadow-[0_0_0_1px_var(--color-ink)] disabled:opacity-50"
          >
            <span>
              <span className="block font-display text-xl">{pack.label}</span>
              <span className="text-sm text-muted">Top of category</span>
            </span>
            <span className="text-lg font-semibold">{formatGhs(pack.priceGhs)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
