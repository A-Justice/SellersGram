"use client";

import { useEffect, useRef, useState } from "react";
import type { Listing } from "@/data/types";
import { ListingGrid } from "./ListingGrid";

export const LISTINGS_PAGE_SIZE = 12;

export function InfiniteListingGrid({
  listings,
  resetKey,
}: {
  listings: Listing[];
  resetKey: string;
}) {
  const [visibleCount, setVisibleCount] = useState(LISTINGS_PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisibleCount(LISTINGS_PAGE_SIZE);
  }, [resetKey]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || visibleCount >= listings.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((current) =>
            Math.min(current + LISTINGS_PAGE_SIZE, listings.length),
          );
        }
      },
      { rootMargin: "280px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [listings.length, visibleCount]);

  const visible = listings.slice(0, visibleCount);
  const hasMore = visibleCount < listings.length;

  return (
    <div className="space-y-5">
      {listings.length > 0 ? (
        <p className="text-sm text-muted">
          Showing {visible.length} of {listings.length} ads
        </p>
      ) : null}
      <ListingGrid listings={visible} />
      {hasMore ? (
        <div ref={sentinelRef} className="flex justify-center py-6">
          <p className="text-sm text-muted">Loading more…</p>
        </div>
      ) : null}
    </div>
  );
}
