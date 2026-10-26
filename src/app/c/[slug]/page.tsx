"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { InfiniteListingGrid } from "@/components/InfiniteListingGrid";
import { SearchBar } from "@/components/SearchBar";
import { categoryById } from "@/lib/categories";
import { embedQuery } from "@/lib/embeddings";
import { useHomeSearch } from "@/context/HomeSearchContext";
import { searchListings } from "@/lib/search";
import { useListings } from "@/lib/use-listings";

function CategoryResults() {
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const category = categoryById(params.slug);
  const q = searchParams.get("q") || "";
  const regionParam = searchParams.get("region") || "";
  const { live, ready } = useListings();
  const { query, setQuery, region, setRegion } = useHomeSearch();
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
    () =>
      searchListings(live, q, regionParam, queryEmbedding, params.slug),
    [live, q, regionParam, queryEmbedding, params.slug],
  );

  const resetKey = `${params.slug}|${q}|${regionParam}|${embedReady}`;

  if (!category) {
    return (
      <div className="py-16 text-center">
        <h1 className="font-display text-3xl">Category not found</h1>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
          Category
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">
          {category.name}
          {regionParam ? "" : " in Ghana"}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {q.trim()
            ? `${listings.length} result${listings.length === 1 ? "" : "s"} for “${q.trim()}” in ${category.name}`
            : category.hint}
        </p>
        <div className="mt-5">
          <SearchBar
            query={query}
            region={region}
            onQueryChange={setQuery}
            onRegionChange={setRegion}
            categoryId={category.id}
            categoryName={category.name}
          />
        </div>
      </div>

      {ready && embedReady ? (
        listings.length ? (
          <InfiniteListingGrid listings={listings} resetKey={resetKey} />
        ) : (
          <p className="rounded-[24px] bg-paper px-5 py-10 text-center text-sm text-muted shadow-[0_0_0_1px_var(--color-line)]">
            {q.trim()
              ? `No ads matched “${q.trim()}” in ${category.name}.`
              : `No live ads in ${category.name} yet.`}
          </p>
        )
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

export default function CategoryPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-10 w-48 animate-pulse rounded-full bg-paper" />
          <div className="h-16 max-w-2xl animate-pulse rounded-[22px] bg-paper" />
        </div>
      }
    >
      <CategoryResults />
    </Suspense>
  );
}
