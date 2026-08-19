"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { RemoteImage } from "@/components/RemoteImage";
import { DeleteAdButton } from "@/components/DeleteAdButton";
import { setListingStatus } from "@/lib/listings-store";
import { formatGhs, timeAgo } from "@/lib/format";
import { useListings } from "@/lib/use-listings";
import type { Listing, ListingStatus } from "@/data/types";

type Tab = "pending" | "live" | "sold" | "rejected" | "hidden" | "all";

const TABS: { id: Tab; label: string; statuses?: ListingStatus[] }[] = [
  { id: "pending", label: "Pending", statuses: ["pending"] },
  { id: "live", label: "Live", statuses: ["live"] },
  { id: "sold", label: "Sold", statuses: ["sold"] },
  { id: "rejected", label: "Rejected", statuses: ["rejected"] },
  { id: "hidden", label: "Hidden", statuses: ["hidden"] },
  { id: "all", label: "All" },
];

const PAGE_SIZE = 8;

function statusStyles(status: ListingStatus) {
  switch (status) {
    case "pending":
      return "bg-gold/20 text-ink";
    case "live":
      return "bg-accent/15 text-accent-dark";
    case "sold":
      return "bg-canvas text-muted";
    case "rejected":
      return "bg-red-100 text-red-800";
    case "hidden":
      return "bg-line text-muted";
    default:
      return "bg-canvas text-muted";
  }
}

export default function AdminListingsPage() {
  const { listings, ready } = useListings();
  const [tab, setTab] = useState<Tab>("pending");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const listRef = useRef<HTMLDivElement>(null);

  const counts = useMemo(() => {
    const map: Record<Tab, number> = {
      pending: 0,
      live: 0,
      sold: 0,
      rejected: 0,
      hidden: 0,
      all: listings.length,
    };
    for (const listing of listings) {
      if (listing.status === "pending") map.pending += 1;
      if (listing.status === "live") map.live += 1;
      if (listing.status === "sold") map.sold += 1;
      if (listing.status === "rejected") map.rejected += 1;
      if (listing.status === "hidden") map.hidden += 1;
    }
    return map;
  }, [listings]);

  const filtered = useMemo(() => {
    const active = TABS.find((item) => item.id === tab);
    const q = query.trim().toLowerCase();
    return listings
      .filter((listing) => {
        if (active?.statuses && !active.statuses.includes(listing.status)) return false;
        if (!q) return true;
        const haystack = [
          listing.title,
          listing.city,
          listing.seller.name,
          listing.status,
          formatGhs(listing.priceGhs),
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [listings, tab, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);

  function switchTab(next: Tab) {
    setTab(next);
    setPage(1);
    listRef.current?.scrollTo({ top: 0 });
  }

  function changePage(next: number) {
    setPage(next);
    listRef.current?.scrollTo({ top: 0 });
  }

  function act(id: string, status: ListingStatus) {
    void setListingStatus(
      listings,
      id,
      status,
      status === "rejected" ? { rejectReason: "Does not match the rules" } : {},
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 space-y-4 pb-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl tracking-tight">Listings</h1>
            <p className="mt-2 text-sm text-muted">
              Review the queue, then manage live and archived ads.
            </p>
          </div>
          <p className="rounded-full bg-paper px-4 py-2 text-sm shadow-[0_0_0_1px_var(--color-line)]">
            {listings.length} total
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => switchTab(item.id)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                tab === item.id
                  ? "bg-ink text-paper"
                  : "bg-paper text-ink shadow-[0_0_0_1px_var(--color-line)] hover:shadow-[0_0_0_1px_var(--color-ink)]"
              }`}
            >
              {item.label}
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] ${
                  tab === item.id ? "bg-paper/15 text-paper" : "bg-canvas text-muted"
                }`}
              >
                {counts[item.id]}
              </span>
            </button>
          ))}
        </div>

        <label className="relative block max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
              listRef.current?.scrollTo({ top: 0 });
            }}
            placeholder="Search title, seller, city…"
            className="field pl-11"
          />
        </label>
      </div>

      <div ref={listRef} className="scroll-soft min-h-0 flex-1 overflow-y-auto pr-1">
        {!ready ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-[24px] bg-paper" />
            ))}
          </div>
        ) : pageItems.length ? (
          <ul className="space-y-3">
            {pageItems.map((listing) => (
              <li key={listing.id}>
                <AdminListingCard
                  listing={listing}
                  showStatus={tab === "all"}
                  onApprove={() => act(listing.id, "live")}
                  onReject={() => act(listing.id, "rejected")}
                  onHide={() => act(listing.id, "hidden")}
                  onRestore={() => act(listing.id, "live")}
                />
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-[24px] border border-dashed border-line bg-paper px-6 py-14 text-center">
            <p className="font-display text-xl">Nothing in this tab</p>
            <p className="mt-2 text-sm text-muted">
              {query.trim()
                ? "Try a different search or switch tabs."
                : tab === "pending"
                  ? "The review queue is clear."
                  : "No listings match this filter yet."}
            </p>
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-line bg-canvas pt-4">
        {ready && filtered.length > 0 ? (
          filtered.length > PAGE_SIZE ? (
            <AdminPagination
              page={safePage}
              totalPages={totalPages}
              total={filtered.length}
              pageSize={PAGE_SIZE}
              onPageChange={changePage}
            />
          ) : (
            <p className="text-sm text-muted">
              Showing {filtered.length} listing{filtered.length === 1 ? "" : "s"}
            </p>
          )
        ) : ready ? (
          <p className="text-sm text-muted">No listings to show.</p>
        ) : null}
      </div>
    </div>
  );
}

function AdminListingCard({
  listing,
  showStatus,
  onApprove,
  onReject,
  onHide,
  onRestore,
}: {
  listing: Listing;
  showStatus: boolean;
  onApprove: () => void;
  onReject: () => void;
  onHide: () => void;
  onRestore: () => void;
}) {
  return (
    <article className="flex flex-col gap-4 rounded-[24px] bg-paper p-4 shadow-[0_0_0_1px_var(--color-line)] sm:flex-row sm:items-center">
      <Link
        href={`/listing/${listing.id}`}
        className="relative h-20 w-16 shrink-0 overflow-hidden rounded-2xl bg-line"
      >
        <RemoteImage src={listing.photoUrls[0] || ""} alt="" className="object-cover" />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/listing/${listing.id}`}
            className="truncate font-medium hover:text-accent"
          >
            {listing.title}
          </Link>
          {(showStatus || listing.status !== "pending") && (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${statusStyles(listing.status)}`}
            >
              {listing.status}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-muted">
          {formatGhs(listing.priceGhs)} · {listing.city} · {listing.seller.name}
        </p>
        <p className="mt-0.5 text-xs text-muted">
          Posted {timeAgo(listing.createdAt)}
          {listing.publishedAt ? ` · Live ${timeAgo(listing.publishedAt)}` : ""}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end">
        {listing.status === "pending" ? (
          <>
            <button
              type="button"
              onClick={onApprove}
              className="h-9 rounded-full bg-accent px-3 text-sm font-medium text-paper"
            >
              Approve
            </button>
            <button
              type="button"
              onClick={onReject}
              className="h-9 rounded-full bg-canvas px-3 text-sm"
            >
              Reject
            </button>
          </>
        ) : null}
        {listing.status === "live" ? (
          <button
            type="button"
            onClick={onHide}
            className="h-9 rounded-full bg-canvas px-3 text-sm"
          >
            Hide
          </button>
        ) : null}
        {(listing.status === "hidden" || listing.status === "rejected") && (
          <button
            type="button"
            onClick={onRestore}
            className="h-9 rounded-full bg-canvas px-3 text-sm"
          >
            Restore live
          </button>
        )}
        <Link
          href={`/listing/${listing.id}`}
          className="inline-flex h-9 items-center rounded-full bg-canvas px-3 text-sm"
        >
          View
        </Link>
        <DeleteAdButton
          listing={listing}
          className="inline-flex h-9 items-center rounded-full px-3 text-sm text-red-700"
        />
      </div>
    </article>
  );
}

function AdminPagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <p className="text-sm text-muted">
        Showing {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex h-10 items-center gap-1 rounded-full bg-paper px-4 text-sm shadow-[0_0_0_1px_var(--color-line)] disabled:opacity-40"
        >
          <ChevronLeft className="size-4" />
          Prev
        </button>
        <span className="px-2 text-sm text-muted">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex h-10 items-center gap-1 rounded-full bg-paper px-4 text-sm shadow-[0_0_0_1px_var(--color-line)] disabled:opacity-40"
        >
          Next
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
