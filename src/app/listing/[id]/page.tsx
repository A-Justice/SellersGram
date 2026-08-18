"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { MessageCircle, Phone, Shield } from "lucide-react";
import { RemoteImage } from "@/components/RemoteImage";
import { ListingGrid } from "@/components/ListingGrid";
import { TopBadge } from "@/components/TopBadge";
import { useAuth } from "@/context/AuthContext";
import { categoryById } from "@/lib/categories";
import { startThread } from "@/lib/chat-store";
import { boostDaysLeft, formatGhs, isBoosted, timeAgo } from "@/lib/format";
import { regionById } from "@/lib/regions";
import { useListings } from "@/lib/use-listings";

export default function ListingPage() {
  const { id } = useParams<{ id: string }>();
  const { listings, ready } = useListings();
  const listing = listings.find((item) => item.id === id);
  const [active, setActive] = useState(0);
  const [note, setNote] = useState("Hi, is this still available?");
  const [sent, setSent] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const more = useMemo(
    () =>
      listings
        .filter(
          (item) =>
            item.status === "live" &&
            item.categoryId === listing?.categoryId &&
            item.id !== listing?.id,
        )
        .slice(0, 4),
    [listings, listing],
  );

  if (ready && !listing) {
    return (
      <div className="py-20 text-center">
        <h1 className="font-display text-3xl">Ad not found</h1>
        <Link href="/" className="mt-4 inline-block text-accent">
          Back home
        </Link>
      </div>
    );
  }

  if (!listing) return null;

  const top = isBoosted(listing);
  const category = categoryById(listing.categoryId);
  const region = regionById(listing.regionId);

  async function chat() {
    if (!user) {
      router.push(`/login?next=/listing/${listing!.id}`);
      return;
    }
    await startThread(listing!, user, note);
    setSent(true);
    router.push("/inbox");
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
      <div>
        <div className="relative aspect-[4/5] overflow-hidden rounded-[28px] bg-paper sm:aspect-[5/4]">
          {listing.photoUrls[active] && (
            <RemoteImage
              src={listing.photoUrls[active]}
              alt={listing.title}
              sizes="(max-width: 1024px) 100vw, 60vw"
              priority
              className="object-cover"
            />
          )}
        </div>
        {listing.photoUrls.length > 1 && (
          <div className="mt-3 flex gap-2">
            {listing.photoUrls.map((photo, index) => (
              <button
                key={photo}
                type="button"
                onClick={() => setActive(index)}
                className={`relative h-16 w-16 overflow-hidden rounded-2xl ${
                  active === index ? "ring-2 ring-ink" : "ring-1 ring-line"
                }`}
              >
                <RemoteImage src={photo} alt="" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted">
            {top && <TopBadge />}
            <span>{category?.name}</span>
            <span>·</span>
            <span>{listing.condition}</span>
          </div>
          <h1 className="mt-3 font-display text-4xl leading-tight tracking-tight">
            {listing.title}
          </h1>
          <p className="mt-3 text-2xl font-semibold">
            {listing.contactForPrice
              ? "Contact for price"
              : formatGhs(listing.priceGhs)}
            {listing.negotiable && !listing.contactForPrice ? (
              <span className="ml-2 text-sm font-medium text-muted">
                Negotiable
              </span>
            ) : null}
          </p>
          <p className="mt-2 text-sm text-muted">
            {listing.city}
            {region ? `, ${region.name}` : ""} ·{" "}
            {timeAgo(listing.publishedAt || listing.createdAt)}
            {top ? ` · Top for ${boostDaysLeft(listing)} more days` : ""}
          </p>
        </div>

        <div className="rounded-[24px] bg-paper p-5 shadow-[0_0_0_1px_var(--color-line)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{listing.seller.name}</p>
              <p className="text-sm text-muted">
                {listing.seller.verified ? "Verified · " : ""}
                {listing.seller.rating} · {listing.seller.reviewCount} reviews
              </p>
            </div>
            <Link
              href={`/seller/${listing.seller.id}`}
              className="text-sm font-medium text-accent"
            >
              Profile
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <a
              href={`tel:${listing.seller.phone}`}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-ink text-sm font-medium text-paper"
            >
              <Phone className="size-4" />
              Call
            </a>
            <button
              type="button"
              onClick={chat}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-accent text-sm font-medium text-paper"
            >
              <MessageCircle className="size-4" />
              Chat
            </button>
          </div>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            className="mt-3 h-20 w-full resize-none rounded-2xl bg-canvas px-3 py-2 text-sm outline-none"
          />
          {sent && (
            <p className="mt-2 text-xs text-accent">Message sent to inbox.</p>
          )}
        </div>

        <div>
          <h2 className="font-display text-xl">Details</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink/80">
            {listing.description}
          </p>
        </div>

        <div className="flex items-start gap-3 rounded-[22px] bg-gold/15 p-4 text-sm">
          <Shield className="mt-0.5 size-4 shrink-0" />
          <p>
            Meet in public. Check the item before you pay. Do not pay in
            advance — even for delivery.{" "}
            <Link href="/safety" className="font-medium underline">
              Safety tips
            </Link>
          </p>
        </div>
      </div>

      {more.length > 0 && (
        <div className="lg:col-span-2">
          <h2 className="mb-4 font-display text-2xl">Similar ads</h2>
          <ListingGrid listings={more} />
        </div>
      )}
    </div>
  );
}
