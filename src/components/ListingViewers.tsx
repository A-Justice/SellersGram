"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ListingViewer } from "@/data/types";
import { subscribeListingViewers } from "@/lib/engagement-store";
import { timeAgo } from "@/lib/format";

type Props = {
  listingId: string;
  sellerId: string;
  className?: string;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] || ""}${parts[1]![0] || ""}`.toUpperCase();
}

export function ListingViewers({ listingId, sellerId, className = "" }: Props) {
  const [viewers, setViewers] = useState<ListingViewer[]>([]);

  useEffect(() => {
    return subscribeListingViewers(sellerId, listingId, setViewers);
  }, [sellerId, listingId]);

  if (!viewers.length) {
    return (
      <div
        className={`rounded-[24px] bg-paper p-5 shadow-[0_0_0_1px_var(--color-line)] ${className}`}
      >
        <h2 className="font-display text-xl tracking-tight">Who viewed</h2>
        <p className="mt-2 text-sm text-muted">
          Signed-in people who open this ad will show up here.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-[24px] bg-paper p-5 shadow-[0_0_0_1px_var(--color-line)] ${className}`}
    >
      <h2 className="font-display text-xl tracking-tight">Who viewed</h2>
      <p className="mt-1 text-sm text-muted">
        {viewers.length} signed-in visitor{viewers.length === 1 ? "" : "s"}
      </p>
      <ul className="mt-4 divide-y divide-line">
        {viewers.map((viewer) => (
          <li key={viewer.viewerUid} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <div className="grid size-10 shrink-0 place-items-center rounded-full bg-canvas text-xs font-semibold text-ink">
              {initials(viewer.viewerName)}
            </div>
            <div className="min-w-0 flex-1">
              <Link
                href={`/seller/${viewer.viewerUid}`}
                className="truncate font-medium text-ink hover:text-accent"
              >
                {viewer.viewerName}
              </Link>
              <p className="text-xs text-muted">
                {timeAgo(viewer.lastViewedAt)}
                {viewer.viewCount > 1 ? ` · ${viewer.viewCount} visits` : ""}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
