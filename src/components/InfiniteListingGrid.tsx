"use client";

import { useEffect, useRef, useState } from "react";
import type { Listing } from "@/data/types";
import { ListingGrid } from "./ListingGrid";

export const LISTINGS_PAGE_SIZE = 12;

export function InfiniteListingGrid({
  listings,
  resetKey,
  pageSize = LISTINGS_PAGE_SIZE,
  showCount = true,
}: {
  listings: Listing[];
  resetKey: string;
  pageSize?: number;
  showCount?: boolean;
}) {
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisibleCount(pageSize);
  }, [resetKey, pageSize]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || visibleCount >= listings.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((current) =>
            Math.min(current + pageSize, listings.length),
          );
        }
      },
      { rootMargin: "280px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [listings.length, visibleCount, pageSize]);

  const visible = listings.slice(0, visibleCount);
  const hasMore = visibleCount < listings.length;

  return (
    <div className="space-y-5">
      {showCount && listings.length > 0 ? (
        <p className="text-sm text-muted">
          Showing {visible.length} of {listings.length} ads
        </p>
      ) : null}
      <ListingGrid listings={visible} />
      {hasMore ? (
        <div
          ref={sentinelRef}
          className="grid grid-cols-2 gap-3 py-2 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5"
          aria-hidden
        >
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="skeleton aspect-[4/5] rounded-[22px]" />
          ))}
        </div>
      ) : null}
    </div>
  );
}
