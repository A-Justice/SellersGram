"use client";

import { useMemo } from "react";
import { ListingGrid } from "@/components/ListingGrid";
import { categoryById } from "@/lib/categories";
import { useListings } from "@/lib/use-listings";
import { useParams } from "next/navigation";

export default function CategoryPage() {
  const params = useParams<{ slug: string }>();
  const category = categoryById(params.slug);
  const { live, ready } = useListings();

  const listings = useMemo(
    () => live.filter((listing) => listing.categoryId === params.slug),
    [live, params.slug],
  );

  if (!category) {
    return (
      <div className="py-16 text-center">
        <h1 className="font-display text-3xl">Category not found</h1>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
          Category
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">
          {category.name}
        </h1>
        <p className="mt-2 text-sm text-muted">{category.hint}</p>
      </div>
      {ready ? <ListingGrid listings={listings} /> : null}
    </div>
  );
}
