"use client";

import { useParams } from "next/navigation";
import { ListingGrid } from "@/components/ListingGrid";
import { useListings } from "@/lib/use-listings";

export default function SellerPage() {
  const { id } = useParams<{ id: string }>();
  const { live } = useListings();
  const ads = live.filter((listing) => listing.seller.id === id);
  const seller = ads[0]?.seller;

  if (!seller) {
    return <p className="py-16 text-center text-muted">Seller not found.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
          Seller
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">{seller.name}</h1>
        <p className="mt-2 text-sm text-muted">
          {seller.city} · Joined {seller.joinedYear} · {seller.rating} from{" "}
          {seller.reviewCount} reviews
          {seller.verified ? " · Verified" : ""}
        </p>
      </div>
      <ListingGrid listings={ads} />
    </div>
  );
}
