"use client";

import { RemoteImage } from "@/components/RemoteImage";
import { DeleteAdButton } from "@/components/DeleteAdButton";
import { setListingStatus } from "@/lib/listings-store";
import { formatGhs } from "@/lib/format";
import { useListings } from "@/lib/use-listings";

export default function AdminListingsPage() {
  const { listings } = useListings();
  const pending = listings.filter((item) => item.status === "pending");
  const rest = listings.filter((item) => item.status !== "pending");

  function act(id: string, status: "live" | "rejected" | "hidden") {
    void setListingStatus(
      listings,
      id,
      status,
      status === "rejected" ? { rejectReason: "Does not match the rules" } : {},
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="font-display text-4xl tracking-tight">Listings</h1>
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">
          Queue
        </h2>
        {pending.map((listing) => (
          <article
            key={listing.id}
            className="flex gap-4 rounded-[24px] bg-paper p-4 shadow-[0_0_0_1px_var(--color-line)]"
          >
            <span className="relative h-20 w-16 overflow-hidden rounded-2xl bg-line">
              {listing.photoUrls[0] && (
                <RemoteImage src={listing.photoUrls[0]} alt="" className="object-cover" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{listing.title}</p>
              <p className="text-sm text-muted">
                {formatGhs(listing.priceGhs)} · {listing.city} · {listing.seller.name}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => act(listing.id, "live")}
                  className="h-9 rounded-full bg-accent px-3 text-sm text-paper"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => act(listing.id, "rejected")}
                  className="h-9 rounded-full bg-canvas px-3 text-sm"
                >
                  Reject
                </button>
                <DeleteAdButton
                  listing={listing}
                  className="h-9 rounded-full px-3 text-sm text-red-700"
                />
              </div>
            </div>
          </article>
        ))}
        {!pending.length && <p className="text-sm text-muted">Queue is clear.</p>}
      </section>
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">
          All
        </h2>
        {rest.map((listing) => (
          <div key={listing.id} className="flex items-center justify-between gap-3 text-sm">
            <span className="min-w-0 truncate pr-4">{listing.title}</span>
            <span className="shrink-0 text-muted">{listing.status}</span>
            <DeleteAdButton listing={listing} className="shrink-0 text-red-700" />
          </div>
        ))}
      </section>
    </div>
  );
}
