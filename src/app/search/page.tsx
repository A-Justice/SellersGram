"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { ListingGrid } from "@/components/ListingGrid";
import { SearchBar } from "@/components/SearchBar";
import { useListings } from "@/lib/use-listings";
import { Suspense } from "react";

function SearchResults() {
  const params = useSearchParams();
  const q = params.get("q") || "";
  const region = params.get("region") || "";
  const { live, ready } = useListings();

  const listings = useMemo(() => {
    return live.filter((listing) => {
      const haystack = `${listing.title} ${listing.description} ${listing.city}`.toLowerCase();
      const matchesQuery = q ? haystack.includes(q.toLowerCase()) : true;
      const matchesRegion = region ? listing.regionId === region : true;
      return matchesQuery && matchesRegion;
    });
  }, [live, q, region]);

  return (
    <div className="space-y-6">
      <div className="max-w-2xl">
        <h1 className="font-display text-4xl tracking-tight">Search</h1>
        <p className="mt-2 text-sm text-muted">Find ads across Ghana.</p>
        <div className="mt-5">
          <SearchBar defaultQuery={q} defaultRegion={region} />
        </div>
      </div>
      {ready ? <ListingGrid listings={listings} /> : null}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchResults />
    </Suspense>
  );
}
