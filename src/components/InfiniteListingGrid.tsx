"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Listing } from "@/data/types";
import { ListingGrid } from "./ListingGrid";

export const LISTINGS_PAGE_SIZE = 12;

export type FeedInsert = {
  /** Show this block after this many ads in the feed. */
  after: number;
  content: ReactNode;
};

export function InfiniteListingGrid({
  listings,
  resetKey,
  pageSize = LISTINGS_PAGE_SIZE,
  showCount = true,
  endMessage,
  inserts = [],
}: {
  listings: Listing[];
  resetKey: string;
  pageSize?: number;
  showCount?: boolean;
  /** Custom end copy; defaults to a count when showCount is on. */
  endMessage?: string;
  /** Content blocks spaced through the feed (e.g. how-it-works, then FAQ). */
  inserts?: FeedInsert[];
}) {
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const sortedInserts = useMemo(
    () =>
      [...inserts]
        .filter((item) => item.after > 0)
        .sort((a, b) => a.after - b.after),
    [inserts],
  );

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

  const segments = useMemo(() => {
    type Segment =
      | { type: "ads"; items: Listing[] }
      | { type: "insert"; key: string; content: ReactNode };

    const result: Segment[] = [];
    let cursor = 0;

    for (const insert of sortedInserts) {
      // If the feed is shorter than the target, place leftover inserts at the end.
      const threshold = exhausted
        ? Math.min(insert.after, listings.length)
        : insert.after;
      if (visibleCount < threshold) break;

      const at = Math.min(threshold, visible.length);
      if (at < cursor) continue;

      const chunk = visible.slice(cursor, at);
      if (chunk.length) result.push({ type: "ads", items: chunk });
      result.push({
        type: "insert",
        key: `insert-${insert.after}`,
        content: insert.content,
      });
      cursor = at;
    }

    const rest = visible.slice(cursor);
    if (rest.length) result.push({ type: "ads", items: rest });
    else if (!result.length && visible.length) {
      result.push({ type: "ads", items: visible });
    }

    return result;
  }, [sortedInserts, visible, visibleCount, exhausted, listings.length]);

  return (
    <div className="space-y-5">
      {showCount && listings.length > 0 ? (
        <p className="text-sm text-muted">
          Showing {visible.length} of {listings.length} ads
        </p>
      ) : null}
      {segments.map((segment, index) =>
        segment.type === "ads" ? (
          <ListingGrid key={`ads-${index}-${segment.items[0]?.id || index}`} listings={segment.items} />
        ) : (
          <div key={segment.key} className="py-4">
            {segment.content}
          </div>
        ),
      )}
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
