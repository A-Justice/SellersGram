"use client";

import { useMemo } from "react";
import { useListings } from "@/lib/use-listings";

export default function AdminSellersPage() {
  const { listings } = useListings();
  const sellers = useMemo(() => {
    const map = new Map<string, { name: string; ads: number; city: string; verified: boolean }>();
    for (const listing of listings) {
      const current = map.get(listing.seller.id) || {
        name: listing.seller.name,
        ads: 0,
        city: listing.seller.city,
        verified: listing.seller.verified,
      };
      current.ads += 1;
      map.set(listing.seller.id, current);
    }
    return [...map.entries()];
  }, [listings]);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl tracking-tight">Sellers</h1>
      <div className="overflow-hidden rounded-[24px] bg-paper shadow-[0_0_0_1px_var(--color-line)]">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.14em] text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">City</th>
              <th className="px-4 py-3 font-medium">Ads</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {sellers.map(([id, seller]) => (
              <tr key={id} className="border-t border-line">
                <td className="px-4 py-3">{seller.name}</td>
                <td className="px-4 py-3 text-muted">{seller.city}</td>
                <td className="px-4 py-3">{seller.ads}</td>
                <td className="px-4 py-3">
                  {seller.verified ? "Verified" : "Standard"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
