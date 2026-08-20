"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { RemoteImage } from "@/components/RemoteImage";
import { DeleteAdButton } from "@/components/DeleteAdButton";
import { setListingStatus } from "@/lib/listings-store";
import { formatGhs, timeAgo } from "@/lib/format";
import { useListings } from "@/lib/use-listings";
import type { Listing, ListingStatus } from "@/data/types";

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

export default function AdminSellerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { listings, ready } = useListings();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const listRef = useRef<HTMLDivElement>(null);

  const sellerListings = useMemo(
    () =>
      listings
        .filter(
          (listing) => listing.seller.id === id || listing.sellerId === id,
        )
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
    [listings, id],
  );

  const seller = sellerListings[0]?.seller;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sellerListings;
    return sellerListings.filter((listing) => {
      const haystack = [
        listing.title,
        listing.city,
        listing.status,
        listing.categoryId,
        listing.subcategoryId,
        formatGhs(listing.priceGhs),
        listing.description,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [sellerListings, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);

  function changePage(next: number) {
    setPage(next);
    listRef.current?.scrollTo({ top: 0 });
  }

  function act(listingId: string, status: ListingStatus) {
    void setListingStatus(
      listings,
      listingId,
      status,
      status === "rejected" ? { rejectReason: "Does not match the rules" } : {},
    );
  }

  if (ready && !seller) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/sellers"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink"
        >
          <ArrowLeft className="size-4" />
          All sellers
        </Link>
        <div className="rounded-[24px] border border-dashed border-line bg-paper px-6 py-14 text-center">
          <p className="font-display text-xl">Seller not found</p>
          <p className="mt-2 text-sm text-muted">
            No ads are linked to this seller yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 space-y-4 pb-4">
        <Link
          href="/admin/sellers"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink"
        >
          <ArrowLeft className="size-4" />
          All sellers
        </Link>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl tracking-tight">
              {seller?.name || "Seller"}
            </h1>
            <p className="mt-2 text-sm text-muted">
              {[seller?.city, seller?.verified ? "Verified" : "Standard", `${sellerListings.length} ads`]
                .filter(Boolean)
                .join(" · ")}
              {seller?.phone ? ` · ${seller.phone}` : ""}
            </p>
          </div>
          {seller ? (
            <Link
              href={`/seller/${id}`}
              className="rounded-full bg-paper px-4 py-2 text-sm shadow-[0_0_0_1px_var(--color-line)] hover:shadow-[0_0_0_1px_var(--color-ink)]"
            >
              Public profile
            </Link>
          ) : null}
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
            placeholder="Search this seller’s ads…"
            className="field field-icon"
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
                <SellerAdCard
                  listing={listing}
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
            <p className="font-display text-xl">No ads match</p>
            <p className="mt-2 text-sm text-muted">
              {query.trim()
                ? "Try a different search."
                : "This seller has no listings yet."}
            </p>
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-line bg-canvas pt-4">
        {ready && filtered.length > 0 ? (
          filtered.length > PAGE_SIZE ? (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-muted">
                Showing {start + 1}–{Math.min(start + PAGE_SIZE, filtered.length)} of{" "}
                {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => changePage(safePage - 1)}
                  className="inline-flex h-10 items-center gap-1 rounded-full bg-paper px-4 text-sm shadow-[0_0_0_1px_var(--color-line)] disabled:opacity-40"
                >
                  <ChevronLeft className="size-4" />
                  Prev
                </button>
                <span className="px-2 text-sm text-muted">
                  Page {safePage} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => changePage(safePage + 1)}
                  className="inline-flex h-10 items-center gap-1 rounded-full bg-paper px-4 text-sm shadow-[0_0_0_1px_var(--color-line)] disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
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

function SellerAdCard({
  listing,
  onApprove,
  onReject,
  onHide,
  onRestore,
}: {
  listing: Listing;
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
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${statusStyles(listing.status)}`}
          >
            {listing.status}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted">
          {formatGhs(listing.priceGhs)} · {listing.city}
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
