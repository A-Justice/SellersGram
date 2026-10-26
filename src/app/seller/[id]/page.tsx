"use client";

import { BadgeCheck, MapPin, Phone } from "lucide-react";
import { useParams } from "next/navigation";
import { ListingGrid } from "@/components/ListingGrid";
import { SellerPageSkeleton } from "@/components/PageSkeleton";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { isAdminSystemUid } from "@/lib/owner";
import { useListings } from "@/lib/use-listings";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] || ""}${parts[1]![0] || ""}`.toUpperCase();
}

export default function SellerPage() {
  const { id } = useParams<{ id: string }>();
  const { live, ready } = useListings();
  const ads = live.filter(
    (listing) => listing.seller.id === id || listing.sellerId === id,
  );
  const seller = ads[0]?.seller;

  if (isAdminSystemUid(id)) {
    return <p className="py-16 text-center text-muted">Profile not available.</p>;
  }

  if (ready && !seller) {
    return <p className="py-16 text-center text-muted">Seller not found.</p>;
  }

  if (!seller) return <SellerPageSkeleton />;

  const phone = seller.phone?.trim() || "";
  const telHref = phone ? `tel:${phone.replace(/\s/g, "")}` : null;
  const ratingLabel =
    seller.reviewCount > 0
      ? `${seller.rating.toFixed(1)} · ${seller.reviewCount} review${
          seller.reviewCount === 1 ? "" : "s"
        }`
      : "New seller";

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 pb-8">
      <section className="overflow-hidden rounded-[28px] bg-paper shadow-[0_0_0_1px_var(--color-line)]">
        <div className="relative overflow-hidden px-5 py-6 sm:px-8 sm:py-8">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(15,106,77,0.12),_transparent_55%),radial-gradient(ellipse_at_bottom_left,_rgba(212,160,23,0.1),_transparent_50%)]"
          />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="grid size-16 shrink-0 place-items-center rounded-full bg-ink font-display text-xl tracking-tight text-paper sm:size-20 sm:text-2xl">
                {initials(seller.name)}
              </div>
              <div className="min-w-0 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                  Seller
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-3xl tracking-tight sm:text-4xl">
                    {seller.name}
                  </h1>
                  {seller.verified ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent-dark">
                      <BadgeCheck className="size-3.5" />
                      Verified
                    </span>
                  ) : null}
                </div>
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3.5 shrink-0" />
                    {seller.city || "Ghana"}
                  </span>
                  <span>Joined {seller.joinedYear}</span>
                  <span>{ratingLabel}</span>
                </p>
              </div>
            </div>

            <div className="flex w-full gap-3 lg:w-auto lg:min-w-[16rem]">
              {telHref ? (
                <a
                  href={telHref}
                  className="inline-flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-canvas px-4 text-sm font-medium text-ink shadow-[0_0_0_1px_var(--color-line)] sm:px-5 lg:flex-none"
                >
                  <Phone className="size-4 shrink-0" />
                  Call
                </a>
              ) : null}
              {phone ? (
                <WhatsAppButton
                  phone={phone}
                  message={`Hi ${seller.name}, I saw your ads on Vendors Gram.`}
                  className="inline-flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 text-sm font-medium text-white sm:px-5 lg:flex-none"
                />
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div>
          <h2 className="font-display text-2xl tracking-tight">Live ads</h2>
          <p className="mt-1 text-sm text-muted">
            {ads.length} listing{ads.length === 1 ? "" : "s"} from {seller.name}
          </p>
        </div>
        {ads.length ? (
          <ListingGrid listings={ads} />
        ) : (
          <p className="rounded-[24px] bg-paper px-5 py-10 text-center text-sm text-muted shadow-[0_0_0_1px_var(--color-line)]">
            No live ads right now.
          </p>
        )}
      </section>
    </div>
  );
}
