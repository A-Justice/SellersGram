"use client";

import { BOOST_PACKAGES } from "@/data/seed";
import { isBoosted } from "@/lib/format";
import { useListings } from "@/lib/use-listings";

export default function AdminHomePage() {
  const { listings } = useListings();
  const pending = listings.filter((item) => item.status === "pending").length;
  const live = listings.filter((item) => item.status === "live").length;
  const top = listings.filter(isBoosted).length;
  const revenue = BOOST_PACKAGES[1].priceGhs * top;

  const stats = [
    [String(pending), "Pending ads"],
    [String(live), "Live ads"],
    [String(top), "Active Top Ads"],
    [`GH₵ ${revenue.toLocaleString()}`, "Boost revenue (est.)"],
  ];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
          Admin
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">Overview</h1>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(([value, label]) => (
          <div
            key={label}
            className="rounded-[24px] bg-paper p-5 shadow-[0_0_0_1px_var(--color-line)]"
          >
            <p className="font-display text-3xl">{value}</p>
            <p className="mt-1 text-sm text-muted">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
