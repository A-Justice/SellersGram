"use client";

import Link from "next/link";
import { CategoryGrid } from "@/components/CategoryGrid";
import { ListingGrid } from "@/components/ListingGrid";
import { SearchBar } from "@/components/SearchBar";
import { useAuth } from "@/context/AuthContext";
import { useHomeSearch } from "@/context/HomeSearchContext";
import { isBoosted } from "@/lib/format";
import { RECOMMENDED_COUNT, recommendListings } from "@/lib/recommendations";
import { useListings } from "@/lib/use-listings";
import { useUserInterests } from "@/lib/use-user-interests";
import { useMemo } from "react";

export default function HomePage() {
  const { live, ready } = useListings();
  const { user } = useAuth();
  const { interests, ready: interestsReady } = useUserInterests();
  const { heroRef, docked, query, setQuery, region, setRegion } = useHomeSearch();
  const top = live.filter(isBoosted).slice(0, 4);
  const fresh = live.filter((listing) => !isBoosted(listing)).slice(0, 8);
  const recommended = useMemo(
    () => recommendListings(live, interests, user?.uid, RECOMMENDED_COUNT),
    [live, interests, user?.uid],
  );
  const showRecommended = Boolean(user && interestsReady && recommended.length);
  const heroSearchOpacity = 1 - docked;
  const heroSearchShift = docked * 18;
  const heroSearchScale = 1 - docked * 0.05;

  return (
    <div className="space-y-12">
      <section className="relative overflow-visible rounded-[32px] bg-ink px-5 py-10 text-paper sm:px-10 sm:py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
          Ghana
        </p>
        <h1 className="mt-4 max-w-xl font-display text-4xl leading-[1.05] tracking-tight sm:text-6xl">
          Buy and sell
          <br />
          without the noise.
        </h1>
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-paper/70 sm:text-base">
          Post an ad in a few steps. Chat or call the seller. Meet in person.
        </p>
        <div
          ref={heroRef}
          className="mt-8 max-w-2xl text-ink transition-[opacity,transform] duration-300 ease-out will-change-[opacity,transform]"
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
            <GridSkeleton count={RECOMMENDED_COUNT} />
          )}
        </section>
      ) : null}

      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-2xl">Top Ads</h2>
          <Link href="/search" className="text-sm font-medium text-accent">
            See all
          </Link>
        </div>
        {ready ? <ListingGrid listings={top} /> : <GridSkeleton />}
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-2xl">Fresh today</h2>
          <Link href="/search" className="text-sm font-medium text-accent">
            See all
          </Link>
        </div>
        {ready ? <ListingGrid listings={fresh} /> : <GridSkeleton />}
      </section>

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
    </div>
  );
}

function GridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="aspect-[4/5] animate-pulse rounded-[22px] bg-paper"
        />
      ))}
    </div>
  );
}
