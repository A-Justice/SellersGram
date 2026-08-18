"use client";

import Link from "next/link";
import { CategoryGrid } from "@/components/CategoryGrid";
import { ListingGrid } from "@/components/ListingGrid";
import { SearchBar } from "@/components/SearchBar";
import { isBoosted } from "@/lib/format";
import { useListings } from "@/lib/use-listings";

export default function HomePage() {
  const { live, ready } = useListings();
  const top = live.filter(isBoosted).slice(0, 4);
  const fresh = live.filter((listing) => !isBoosted(listing)).slice(0, 8);

  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-[32px] bg-ink px-5 py-10 text-paper sm:px-10 sm:py-14">
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
        <div className="mt-8 max-w-2xl text-ink">
          <SearchBar />
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

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="aspect-[4/5] animate-pulse rounded-[22px] bg-paper"
        />
      ))}
    </div>
  );
}
