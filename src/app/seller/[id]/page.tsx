"use client";

import { BadgeCheck, MapPin, Phone } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ListingGrid } from "@/components/ListingGrid";
import { SellerPageSkeleton } from "@/components/PageSkeleton";
import { RemoteImage } from "@/components/RemoteImage";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import type { Seller } from "@/data/types";
import { db } from "@/lib/firebase";
import { isAdminSystemUid } from "@/lib/owner";
import { useListings } from "@/lib/use-listings";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] || ""}${parts[1]![0] || ""}`.toUpperCase();
}

function sellerFromProfile(
  id: string,
  data: Record<string, unknown> | null,
): Seller | null {
  if (!data) return null;
  const name = String(data.name || "").trim();
  if (!name) return null;
  const createdAt = data.createdAt as { toDate?: () => Date } | string | undefined;
  let joinedYear = new Date().getFullYear();
  if (createdAt && typeof createdAt === "object" && createdAt.toDate) {
    joinedYear = createdAt.toDate().getFullYear();
  } else if (typeof createdAt === "string" && createdAt) {
    const year = new Date(createdAt).getFullYear();
    if (Number.isFinite(year)) joinedYear = year;
  }
  return {
    id,
    name,
    phone: String(data.phone || "").trim(),
    joinedYear,
    rating: Number(data.rating) || 5,
    reviewCount: Number(data.reviewCount) || 0,
    verified: Boolean(data.verified),
    city: String(data.city || "").trim() || "Ghana",
    photoUrl: String(data.photoUrl || "").trim() || null,
    bannerUrl: String(data.bannerUrl || "").trim() || null,
  };
}

function mergeSeller(
  fromListing: Seller | null,
  fromProfile: Seller | null,
): Seller | null {
  if (!fromListing && !fromProfile) return null;
  const base = fromProfile || fromListing!;
  return {
    ...base,
    ...(fromListing
      ? {
          name: fromProfile?.name || fromListing.name,
          phone: fromProfile?.phone || fromListing.phone,
          city:
            fromProfile?.city && fromProfile.city !== "Ghana"
              ? fromProfile.city
              : fromListing.city || fromProfile?.city || "Ghana",
          verified: Boolean(fromProfile?.verified || fromListing.verified),
          joinedYear: fromProfile?.joinedYear || fromListing.joinedYear,
          rating: fromListing.rating,
          reviewCount: fromListing.reviewCount,
        }
      : {}),
    photoUrl: fromProfile?.photoUrl || null,
    bannerUrl: fromProfile?.bannerUrl || null,
  };
}

export default function SellerPage() {
  const { id } = useParams<{ id: string }>();
  const { listings, live, ready } = useListings();
  const [profileSeller, setProfileSeller] = useState<Seller | null>(null);
  const [profileReady, setProfileReady] = useState(false);

  const owned = useMemo(
    () =>
      listings.filter(
        (listing) => listing.seller.id === id || listing.sellerId === id,
      ),
    [listings, id],
  );
  const ads = useMemo(
    () =>
      live.filter(
        (listing) => listing.seller.id === id || listing.sellerId === id,
      ),
    [live, id],
  );
  const listingSeller = ads[0]?.seller || owned[0]?.seller || null;
  const seller = mergeSeller(listingSeller, profileSeller);

  useEffect(() => {
    let cancelled = false;
    setProfileReady(false);
    setProfileSeller(null);

    if (!id || isAdminSystemUid(id) || !db) {
      setProfileReady(true);
      return;
    }

    void getDoc(doc(db, "users", id))
      .then((snap) => {
        if (cancelled) return;
        setProfileSeller(
          snap.exists()
            ? sellerFromProfile(id, snap.data() as Record<string, unknown>)
            : null,
        );
        setProfileReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        setProfileSeller(null);
        setProfileReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (isAdminSystemUid(id)) {
    return <p className="py-16 text-center text-muted">Profile not available.</p>;
  }

  if ((!ready || !profileReady) && !seller) {
    return <SellerPageSkeleton />;
  }

  if (ready && profileReady && !seller) {
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
  const photoUrl = seller.photoUrl?.trim() || "";
  const bannerUrl = seller.bannerUrl?.trim() || "";

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 pb-8">
      <section className="overflow-hidden rounded-[28px] bg-paper shadow-[0_0_0_1px_var(--color-line)]">
        <div className="relative h-40 bg-ink sm:h-52 lg:h-56">
          {bannerUrl ? (
            <RemoteImage
              src={bannerUrl}
              alt=""
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 1024px"
              priority
            />
          ) : (
            <div
              aria-hidden
              className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(212,160,23,0.4),_transparent_55%),radial-gradient(ellipse_at_bottom_left,_rgba(15,106,77,0.5),_transparent_50%)]"
            />
          )}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-paper via-paper/70 to-transparent" />
        </div>

        <div className="relative px-5 pb-6 sm:px-8 sm:pb-8">
          <div className="-mt-12 flex flex-col gap-5 sm:-mt-14 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex min-w-0 items-end gap-4">
              <div className="relative size-24 shrink-0 overflow-hidden rounded-full bg-ink shadow-[0_0_0_4px_var(--color-paper)] sm:size-28">
                {photoUrl ? (
                  <RemoteImage
                    src={photoUrl}
                    alt=""
                    className="object-cover"
                    sizes="112px"
                    priority
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center font-display text-3xl tracking-tight text-paper sm:text-4xl">
                    {initials(seller.name)}
                  </div>
                )}
              </div>
              <div className="min-w-0 space-y-2 pb-1">
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
