import { ListingCard } from "./ListingCard";
import type { Listing } from "@/data/types";

export function ListingGrid({ listings }: { listings: Listing[] }) {
  if (!listings.length) {
    return (
      <div className="rounded-[24px] border border-dashed border-line bg-paper px-6 py-16 text-center">
        <p className="font-display text-xl text-ink">Nothing here yet</p>
        <p className="mt-2 text-sm text-muted">
          Try another search, or post the first ad.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}
