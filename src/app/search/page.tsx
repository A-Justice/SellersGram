"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { InfiniteListingGrid } from "@/components/InfiniteListingGrid";
import { SearchBar } from "@/components/SearchBar";
import { useHomeSearch } from "@/context/HomeSearchContext";
import { embedQuery } from "@/lib/embeddings";
import { useListings } from "@/lib/use-listings";
import { searchListings } from "@/lib/search";

function SearchResults() {
  const params = useSearchParams();
  const q = params.get("q") || "";
  const regionParam = params.get("region") || "";
  const { live, ready } = useListings();
  const { heroRef, docked, query, setQuery, region, setRegion } = useHomeSearch();
  const [queryEmbedding, setQueryEmbedding] = useState<number[] | null>(null);
  const [embedReady, setEmbedReady] = useState(!q.trim());

  useEffect(() => {
    setQuery(q);
    setRegion(regionParam);
  }, [q, regionParam, setQuery, setRegion]);

  useEffect(() => {
    const queryText = q.trim();
    if (!queryText) {
      setQueryEmbedding(null);
      setEmbedReady(true);
      return;
    }
    let cancelled = false;
    setEmbedReady(false);
    void embedQuery(queryText).then((embedding) => {
      if (cancelled) return;
      setQueryEmbedding(embedding);
      setEmbedReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [q]);

  const listings = useMemo(
    () => searchListings(live, q, regionParam, queryEmbedding),
    [live, q, regionParam, queryEmbedding],
  );

  const heroSearchOpacity = 1 - docked;
  const heroSearchShift = docked * 18;
  const heroSearchScale = 1 - docked * 0.05;
  const resetKey = `${q}|${regionParam}|${embedReady}`;

  return (
    <div className="space-y-6">
      <div className="max-w-2xl">
        <h1 className="font-display text-4xl tracking-tight">Search</h1>
        <p className="mt-2 text-sm text-muted">
          Type a few words — feminine bags, used sofa, Accra phone — even if the ad
          uses different wording.
        </p>
        <div
          ref={heroRef}
          className="mt-5 transition-[opacity,transform] duration-300 ease-out will-change-[opacity,transform]"
          style={{
            opacity: heroSearchOpacity,
            transform: `translateY(${-heroSearchShift}px) scale(${heroSearchScale})`,
            pointerEvents: docked > 0.92 ? "none" : "auto",
          }}
        >
          <SearchBar
            query={query}
            region={region}
            onQueryChange={setQuery}
            onRegionChange={setRegion}
          />
        </div>
      </div>
      {ready && embedReady ? (
        <InfiniteListingGrid listings={listings} resetKey={resetKey} />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="aspect-[4/5] animate-pulse rounded-[22px] bg-paper"
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="aspect-[4/5] animate-pulse rounded-[22px] bg-paper"
            />
          ))}
        </div>
      }
    >
      <SearchResults />
    </Suspense>
  );
}
