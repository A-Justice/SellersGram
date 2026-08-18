"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ListingGrid } from "@/components/ListingGrid";
import { SearchBar } from "@/components/SearchBar";
import { embedQuery } from "@/lib/embeddings";
import { useListings } from "@/lib/use-listings";
import { searchListings } from "@/lib/search";
import { Suspense } from "react";

function SearchResults() {
  const params = useSearchParams();
  const q = params.get("q") || "";
  const region = params.get("region") || "";
  const { live, ready } = useListings();
  const [queryEmbedding, setQueryEmbedding] = useState<number[] | null>(null);
  const [embedReady, setEmbedReady] = useState(!q.trim());

  useEffect(() => {
    const query = q.trim();
    if (!query) {
      setQueryEmbedding(null);
      setEmbedReady(true);
      return;
    }
    let cancelled = false;
    setEmbedReady(false);
    void embedQuery(query).then((embedding) => {
      if (cancelled) return;
      setQueryEmbedding(embedding);
      setEmbedReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [q]);

  const listings = useMemo(
    () => searchListings(live, q, region, queryEmbedding),
    [live, q, region, queryEmbedding],
  );

  return (
    <div className="space-y-6">
      <div className="max-w-2xl">
        <h1 className="font-display text-4xl tracking-tight">Search</h1>
        <p className="mt-2 text-sm text-muted">
          Type a few words — feminine bags, used sofa, Accra phone — even if the ad uses different wording.
        </p>
        <div className="mt-5">
          <SearchBar defaultQuery={q} defaultRegion={region} />
        </div>
      </div>
      {ready && embedReady ? <ListingGrid listings={listings} /> : null}
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
