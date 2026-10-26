"use client";

import Link from "next/link";
import { useMemo } from "react";
import { CategoryGrid } from "@/components/CategoryGrid";
import { InfiniteListingGrid } from "@/components/InfiniteListingGrid";
import { ListingGrid } from "@/components/ListingGrid";
import { ListingGridSkeleton } from "@/components/PageSkeleton";
import { SearchBar } from "@/components/SearchBar";
import { useAuth } from "@/context/AuthContext";
import { useHomeSearch } from "@/context/HomeSearchContext";
import type { Listing } from "@/data/types";
import { isBoosted } from "@/lib/format";
import { RECOMMENDED_COUNT, recommendListings } from "@/lib/recommendations";
import { useListings } from "@/lib/use-listings";
import { useUserInterests } from "@/lib/use-user-interests";

export function HomePageClient({ initialLive }: { initialLive: Listing[] }) {
  const { live: clientLive, ready } = useListings();
  const { user } = useAuth();
  const { interests, ready: interestsReady } = useUserInterests();
  const { heroRef, docked, query, setQuery, region, setRegion } = useHomeSearch();

  // SSR feed first; switch to realtime client data once Firestore hydrates.
  const live = ready ? clientLive : initialLive;
  const top = live.filter(isBoosted).slice(0, 4);
  const topIds = useMemo(() => new Set(top.map((item) => item.id)), [top]);
  const recommended = useMemo(
    () => recommendListings(live, interests, user?.uid, RECOMMENDED_COUNT),
    [live, interests, user?.uid],
  );
  const showRecommended = Boolean(user && interestsReady && recommended.length);
  // Rest of the home feed — grows as you scroll (skips ads already shown above).
  const feed = useMemo(() => {
    const skip = new Set(topIds);
    if (showRecommended) {
      for (const item of recommended) skip.add(item.id);
    }
    return live.filter((listing) => !skip.has(listing.id));
  }, [live, topIds, recommended, showRecommended]);
  const feedResetKey = `${ready ? "live" : "ssr"}:${feed.length}:${feed[0]?.id || ""}`;
  const heroSearchOpacity = 1 - docked;
  const heroSearchShift = docked * 18;
  const heroSearchScale = 1 - docked * 0.05;

  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-[32px] bg-ink px-5 py-10 text-paper sm:px-10 sm:py-14">
        <svg
          aria-hidden
          className="pointer-events-none absolute -right-2 top-6 h-24 w-24 text-gold/35 sm:right-8 sm:top-10 sm:h-28 sm:w-28"
          viewBox="0 0 100 100"
          fill="none"
        >
          <path
            d="M18 62c12-28 38-40 58-28"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="campus-doodle"
          />
          <path
            d="M72 22c6 4 10 12 8 20M78 18c4 6 5 14 2 20"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="campus-doodle campus-doodle-delay"
          />
          <circle cx="28" cy="28" r="3" fill="currentColor" className="campus-float" />
          <path
            d="M22 78c8 2 16-2 20-10"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="campus-doodle campus-doodle-delay"
          />
        </svg>

        <div className="relative flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
            Buy · Sell · Connect
          </p>
          <p className="font-display text-sm italic leading-snug text-paper/55 sm:text-[15px]">
            Student businesses. Real people. One platform.
          </p>
        </div>

        <h1 className="relative mt-5 max-w-2xl font-display text-4xl leading-[1.05] tracking-tight sm:mt-4 sm:text-6xl">
          Marketplace for{" "}
          <span className="relative inline-block">
            Campus and Beyond
            <svg
              aria-hidden
              className="absolute -bottom-1 left-0 w-full text-gold sm:-bottom-2"
              viewBox="0 0 280 12"
              preserveAspectRatio="none"
              height="10"
            >
              <path
                d="M2 8c50-6 100 4 160-2s70-2 110 2"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                className="campus-underline"
              />
            </svg>
          </span>
        </h1>
        <p className="relative mt-5 max-w-lg text-sm leading-relaxed text-paper/75 sm:text-base">
          Discover, buy and sell products and services right on campus — and
          beyond. From essentials to unique finds.
        </p>

        <div className="relative mt-5 inline-flex items-center">
          <span className="campus-badge rounded-[1.25rem] bg-accent px-3.5 py-1.5 text-xs font-semibold tracking-wide text-paper sm:text-sm">
            Free for Everyone Forever
          </span>
        </div>

        <div
          ref={heroRef}
          className="relative mt-8 max-w-2xl text-ink transition-[opacity,transform] duration-300 ease-out will-change-[opacity,transform]"
          style={{
            opacity: heroSearchOpacity,
            transform: `translateY(${-heroSearchShift}px) scale(${heroSearchScale})`,
            pointerEvents: docked > 0.92 ? "none" : "auto",
          }}
        >
          <SearchBar
            query={query}
            region={region}
            onQueryChange={setQuery}
            onRegionChange={setRegion}
          />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl">Browse</h2>
          <p className="text-sm text-muted">Ten clear categories. That is it.</p>
        </div>
        <CategoryGrid />
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-2xl">Top Ads</h2>
          <Link href="/search" className="text-sm font-medium text-accent">
            See all
          </Link>
        </div>
        <ListingGrid listings={top} />
      </section>

      {showRecommended ? (
        <section className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-display text-2xl">Recommended for you</h2>
              <p className="mt-1 text-sm text-muted">
                From categories you browsed, then top ads and fresh picks.
              </p>
            </div>
          </div>
          {ready ? (
            <ListingGrid listings={recommended} />
          ) : (
            <ListingGridSkeleton count={RECOMMENDED_COUNT} />
          )}
        </section>
      ) : null}

      <section className="grid gap-4 rounded-[28px] bg-paper p-6 shadow-[0_0_0_1px_var(--color-line)] sm:grid-cols-3 sm:p-8">
        {[
          ["Post an ad", "Photos, price, place. A few steps and you are live."],
          ["Talk direct", "Chat in the app or call. Meet in public."],
          ["Stay local", "Search by region and city across Ghana."],
        ].map(([title, copy]) => (
          <div key={title}>
            <h3 className="font-display text-xl">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{copy}</p>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl">More ads</h2>
            <p className="mt-1 text-sm text-muted">
              Keep scrolling — more listings load as you go.
            </p>
          </div>
          <Link href="/search" className="text-sm font-medium text-accent">
            Search
          </Link>
        </div>
        <InfiniteListingGrid
          listings={feed}
          resetKey={feedResetKey}
          pageSize={8}
          showCount={false}
        />
      </section>
    </div>
  );
}
