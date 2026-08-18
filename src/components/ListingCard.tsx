import Link from "next/link";
import type { Listing } from "@/data/types";
import { formatGhs, isBoosted, timeAgo } from "@/lib/format";
import { RemoteImage } from "./RemoteImage";
import { TopBadge } from "./TopBadge";

export function ListingCard({ listing }: { listing: Listing }) {
  const top = isBoosted(listing);
  const photo = listing.photoUrls[0];

  return (
    <Link href={`/listing/${listing.id}`} className="group block">
      <article className="overflow-hidden rounded-[22px] bg-paper shadow-[0_0_0_1px_var(--color-line)] transition duration-200 group-hover:-translate-y-0.5 group-hover:shadow-[0_0_0_1px_var(--color-ink)]">
        <div className="relative aspect-[4/5] bg-line">
          {photo && (
            <RemoteImage
              src={photo}
              alt={listing.title}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition duration-500 group-hover:scale-[1.03]"
            />
          )}
          <div className="absolute left-3 top-3 flex items-center gap-2">
            {top && <TopBadge />}
            <span className="rounded-full bg-paper/90 px-2 py-0.5 text-[11px] font-medium text-ink">
              {listing.condition === "new" ? "New" : "Used"}
            </span>
          </div>
        </div>
        <div className="space-y-1.5 p-3.5">
          <p className="text-[15px] font-semibold tracking-tight text-ink">
            {listing.contactForPrice ? "Contact for price" : formatGhs(listing.priceGhs)}
            {listing.negotiable && !listing.contactForPrice ? (
              <span className="ml-1.5 text-[11px] font-medium uppercase tracking-wider text-muted">
                Negotiable
              </span>
            ) : null}
          </p>
          <h3 className="line-clamp-2 text-sm leading-snug text-ink/90">
            {listing.title}
          </h3>
          <p className="text-xs text-muted">
            {listing.city} · {timeAgo(listing.publishedAt || listing.createdAt)}
          </p>
        </div>
      </article>
    </Link>
  );
}
