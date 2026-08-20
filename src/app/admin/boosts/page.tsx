"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { BOOST_PACKAGES } from "@/data/seed";
import { RemoteImage } from "@/components/RemoteImage";
import { boostListing, endBoost } from "@/lib/listings-store";
import { boostDaysLeft, formatGhs, isBoosted, timeAgo } from "@/lib/format";
import { useListings } from "@/lib/use-listings";
import type { Listing } from "@/data/types";

type Tab = "active" | "ending" | "ended";

const PAGE_SIZE = 8;
const ENDING_SOON_DAYS = 2;

function endsAt(listing: Listing) {
  return listing.boostedUntil ? new Date(listing.boostedUntil) : null;
}

function formatEnds(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminBoostsPage() {
  const { listings, ready } = useListings();
  const [tab, setTab] = useState<Tab>("active");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const active = useMemo(
    () =>
      listings
        .filter(isBoosted)
        .sort(
          (a, b) =>
            new Date(a.boostedUntil || 0).getTime() -
            new Date(b.boostedUntil || 0).getTime(),
        ),
    [listings],
  );

  const endingSoon = useMemo(
    () => active.filter((listing) => boostDaysLeft(listing) <= ENDING_SOON_DAYS),
    [active],
  );

  const recentlyEnded = useMemo(() => {
    const cutoff = Date.now() - 30 * 86400000;
    return listings
      .filter((listing) => {
        if (!listing.boostedUntil || isBoosted(listing)) return false;
        const ended = new Date(listing.boostedUntil).getTime();
        return ended >= cutoff;
      })
      .sort(
        (a, b) =>
          new Date(b.boostedUntil || 0).getTime() -
          new Date(a.boostedUntil || 0).getTime(),
      );
  }, [listings]);

  const counts: Record<Tab, number> = {
    active: active.length,
    ending: endingSoon.length,
    ended: recentlyEnded.length,
  };

  const source =
    tab === "active" ? active : tab === "ending" ? endingSoon : recentlyEnded;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return source;
    return source.filter((listing) => {
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
    });
  }, [source, query]);

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

  async function extend(listingId: string, days: number) {
    setBusyId(listingId);
    try {
      await boostListing(listings, listingId, days);
    } finally {
      setBusyId(null);
    }
  }

  async function stop(listingId: string) {
    setBusyId(listingId);
    try {
      await endBoost(listings, listingId);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 space-y-4 pb-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl tracking-tight">Boosts</h1>
            <p className="mt-2 text-sm text-muted">
              Top Ads paid through Paystack. Extend or end boosts for sellers.
            </p>
          </div>
          <p className="rounded-full bg-paper px-4 py-2 text-sm shadow-[0_0_0_1px_var(--color-line)]">
            {active.length} active
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Active top ads" value={String(active.length)} />
          <Stat
            label={`Ending in ≤${ENDING_SOON_DAYS} days`}
            value={String(endingSoon.length)}
            tone={endingSoon.length ? "warn" : "default"}
          />
          <Stat label="Packages" value={String(BOOST_PACKAGES.length)} />
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            Packages
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {BOOST_PACKAGES.map((pack) => (
              <div
                key={pack.id}
                className="rounded-[24px] bg-paper px-5 py-4 shadow-[0_0_0_1px_var(--color-line)]"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-display text-2xl tracking-tight">{pack.label}</p>
                  <p className="text-lg font-semibold">{formatGhs(pack.priceGhs)}</p>
                </div>
                <p className="mt-1 text-sm text-muted">
                  ~{formatGhs(Math.round((pack.priceGhs / pack.days) * 10) / 10)}
                  /day · Top of category
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: "active", label: "Active" },
              { id: "ending", label: "Ending soon" },
              { id: "ended", label: "Recently ended" },
            ] as const
          ).map((item) => (
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
            placeholder="Search boosted ads, seller, city…"
            className="field field-icon"
          />
        </label>
      </div>

      <div ref={listRef} className="scroll-soft min-h-0 flex-1 overflow-y-auto pr-1">
        {!ready ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-28 animate-pulse rounded-[24px] bg-paper" />
            ))}
          </div>
        ) : pageItems.length ? (
          <ul className="space-y-3">
            {pageItems.map((listing) => (
              <li key={listing.id}>
                <BoostCard
                  listing={listing}
                  mode={tab}
                  busy={busyId === listing.id}
                  onExtend={(days) => void extend(listing.id, days)}
                  onEnd={() => void stop(listing.id)}
                />
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-[24px] border border-dashed border-line bg-paper px-6 py-14 text-center">
            <p className="font-display text-xl">
              {tab === "active"
                ? "No active boosts"
                : tab === "ending"
                  ? "Nothing ending soon"
                  : "No recently ended boosts"}
            </p>
            <p className="mt-2 text-sm text-muted">
              {query.trim()
                ? "Try a different search."
                : tab === "active"
                  ? "When sellers pay for Top Ads, they show up here."
                  : tab === "ending"
                    ? `Ads with ≤${ENDING_SOON_DAYS} days left appear here.`
                    : "Boosts that ended in the last 30 days appear here."}
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
              Showing {filtered.length} boost{filtered.length === 1 ? "" : "s"}
            </p>
          )
        ) : ready ? (
          <p className="text-sm text-muted">Nothing to show.</p>
        ) : null}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "warn";
}) {
  return (
    <div className="rounded-[24px] bg-paper px-5 py-4 shadow-[0_0_0_1px_var(--color-line)]">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
        {label}
      </p>
      <p
        className={`mt-2 font-display text-3xl tracking-tight ${
          tone === "warn" ? "text-gold" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function BoostCard({
  listing,
  mode,
  busy,
  onExtend,
  onEnd,
}: {
  listing: Listing;
  mode: Tab;
  busy: boolean;
  onExtend: (days: number) => void;
  onEnd: () => void;
}) {
  const daysLeft = boostDaysLeft(listing);
  const sellerId = listing.sellerId || listing.seller.id;
  const until = endsAt(listing);
  const active = mode !== "ended" && isBoosted(listing);

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
          {active ? (
            <span className="rounded-full bg-gold/25 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink">
              Top · {daysLeft}d left
            </span>
          ) : (
            <span className="rounded-full bg-canvas px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
              Ended
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-muted">
          {formatGhs(listing.priceGhs)} · {listing.city} ·{" "}
          <Link href={`/admin/sellers/${sellerId}`} className="hover:text-ink">
            {listing.seller.name}
          </Link>
        </p>
        <p className="mt-0.5 text-xs text-muted">
          {listing.boostedUntil
            ? active
              ? `Ends ${formatEnds(listing.boostedUntil)}`
              : `Ended ${timeAgo(listing.boostedUntil)} (${formatEnds(listing.boostedUntil)})`
            : null}
          {until && active ? ` · ${listing.status}` : ""}
        </p>
        {active ? (
          <div className="mt-2 h-1.5 max-w-xs overflow-hidden rounded-full bg-canvas">
            <div
              className="h-full rounded-full bg-gold"
              style={{
                width: `${Math.min(100, Math.max(8, (daysLeft / 14) * 100))}%`,
              }}
            />
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end">
        {BOOST_PACKAGES.map((pack) => (
          <button
            key={pack.id}
            type="button"
            disabled={busy}
            onClick={() => onExtend(pack.days)}
            className="h-9 rounded-full bg-canvas px-3 text-sm disabled:opacity-40"
          >
            +{pack.days}d
          </button>
        ))}
        {active ? (
          <button
            type="button"
            disabled={busy}
            onClick={onEnd}
            className="h-9 rounded-full px-3 text-sm text-red-700 disabled:opacity-40"
          >
            End boost
          </button>
        ) : null}
        <Link
          href={`/listing/${listing.id}`}
          className="inline-flex h-9 items-center rounded-full bg-canvas px-3 text-sm"
        >
          View
        </Link>
      </div>
    </article>
  );
}
