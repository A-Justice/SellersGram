"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useListings } from "@/lib/use-listings";

const PAGE_SIZE = 20;

export default function AdminSellersPage() {
  const { listings, ready } = useListings();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const sellers = useMemo(() => {
    const map = new Map<
      string,
      { name: string; ads: number; city: string; verified: boolean; phone: string }
    >();
    for (const listing of listings) {
      const id = listing.seller.id || listing.sellerId || "";
      if (!id) continue;
      const current = map.get(id) || {
        name: listing.seller.name,
        ads: 0,
        city: listing.seller.city,
        verified: listing.seller.verified,
        phone: listing.seller.phone || "",
      };
      current.ads += 1;
      if (!current.phone && listing.seller.phone) current.phone = listing.seller.phone;
      map.set(id, current);
    }
    return [...map.entries()].sort((a, b) =>
      a[1].name.localeCompare(b[1].name, undefined, { sensitivity: "base" }),
    );
  }, [listings]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sellers;
    return sellers.filter(([id, seller]) => {
      const haystack = [seller.name, seller.city, seller.phone, id].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [sellers, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 space-y-4 pb-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl tracking-tight">Sellers</h1>
            <p className="mt-2 text-sm text-muted">
              Open a seller to review everything they are selling.
            </p>
          </div>
          <p className="rounded-full bg-paper px-4 py-2 text-sm shadow-[0_0_0_1px_var(--color-line)]">
            {filtered.length} seller{filtered.length === 1 ? "" : "s"}
          </p>
        </div>

        <label className="relative block max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Search sellers by name, city, phone…"
            className="field field-icon"
          />
        </label>
      </div>

      <div className="scroll-soft min-h-0 flex-1 overflow-y-auto pr-1">
        {!ready ? (
          <div className="h-40 animate-pulse rounded-[24px] bg-paper" />
        ) : pageItems.length ? (
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
                {pageItems.map(([id, seller]) => (
                  <tr key={id} className="border-t border-line">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/sellers/${id}`}
                        className="font-medium hover:text-accent"
                      >
                        {seller.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted">{seller.city || "—"}</td>
                    <td className="px-4 py-3">{seller.ads}</td>
                    <td className="px-4 py-3">
                      {seller.verified ? "Verified" : "Standard"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-[24px] border border-dashed border-line bg-paper px-6 py-14 text-center">
            <p className="font-display text-xl">No sellers found</p>
            <p className="mt-2 text-sm text-muted">
              {query.trim() ? "Try a different search." : "No seller ads yet."}
            </p>
          </div>
        )}
      </div>

      {ready && filtered.length > PAGE_SIZE ? (
        <div className="shrink-0 border-t border-line bg-canvas pt-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-muted">
              Showing {start + 1}–{Math.min(start + PAGE_SIZE, filtered.length)} of{" "}
              {filtered.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage(safePage - 1)}
                className="h-10 rounded-full bg-paper px-4 text-sm shadow-[0_0_0_1px_var(--color-line)] disabled:opacity-40"
              >
                Prev
              </button>
              <span className="px-2 text-sm text-muted">
                Page {safePage} of {totalPages}
              </span>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage(safePage + 1)}
                className="h-10 rounded-full bg-paper px-4 text-sm shadow-[0_0_0_1px_var(--color-line)] disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
