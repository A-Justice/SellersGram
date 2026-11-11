"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Listing } from "@/data/types";
import { ListingGrid } from "./ListingGrid";

export const LISTINGS_PAGE_SIZE = 12;

export function InfiniteListingGrid({
  listings,
  resetKey,
  pageSize = LISTINGS_PAGE_SIZE,
  showCount = true,
  endMessage,
  midSlot,
  midAfter,
}: {
  listings: Listing[];
  resetKey: string;
  pageSize?: number;
  showCount?: boolean;
  /** Custom end copy; defaults to a count when showCount is on. */
  endMessage?: string;
  /** Inserted after the first batch of ads (e.g. FAQ mid-feed). */
  midSlot?: ReactNode;
  /** How many ads to show before midSlot. Defaults to pageSize. */
  midAfter?: number;
}) {
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const insertAt = Math.min(midAfter ?? pageSize, listings.length);

  useEffect(() => {
    setVisibleCount(pageSize);
  }, [resetKey, pageSize]);

  // Keep paging while the sentinel is in (or near) view so a short page
  // never leaves the feed stuck before the full list is shown.
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || visibleCount >= listings.length) return;

    const loadMore = () => {
      setVisibleCount((current) => {
        if (current >= listings.length) return current;
        return Math.min(current + pageSize, listings.length);
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "400px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [listings.length, visibleCount, pageSize]);

  const visible = listings.slice(0, visibleCount);
  const hasMore = visibleCount < listings.length;
  const exhausted = listings.length > 0 && !hasMore;
  const resolvedEnd =
    endMessage ??
    (showCount ? `You've seen all ${listings.length} ads` : null);

  const showMid = Boolean(midSlot) && insertAt > 0 && visibleCount >= insertAt;
  const before = showMid ? visible.slice(0, insertAt) : visible;
  const after = showMid ? visible.slice(insertAt) : [];

  return (
    <div className="space-y-5">
      {showCount && listings.length > 0 ? (
        <p className="text-sm text-muted">
          Showing {visible.length} of {listings.length} ads
        </p>
      ) : null}
      {before.length ? <ListingGrid listings={before} /> : null}
      {showMid ? <div className="space-y-12 py-4">{midSlot}</div> : null}
      {after.length ? <ListingGrid listings={after} /> : null}
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
      {exhausted && resolvedEnd ? (
        <p className="pb-2 text-center text-sm text-muted">{resolvedEnd}</p>
      ) : null}
    </div>
  );
}
