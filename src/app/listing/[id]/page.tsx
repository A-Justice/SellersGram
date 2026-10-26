import type { Metadata } from "next";
import { categoryById } from "@/lib/categories";
import { publicEnv } from "@/lib/env";
import { formatGhs } from "@/lib/format";
import { regionById } from "@/lib/regions";
import { getListingById } from "@/lib/server/listings";
import { ListingPageClient } from "./ListingPageClient";

/** Cache listing HTML/metadata briefly; client still streams live Firestore updates. */
export const revalidate = 120;

type PageProps = {
  params: Promise<{ id: string }>;
};

function siteOrigin() {
  return publicEnv.appUrl.replace(/\/$/, "") || "https://vendorsgram.com";
}

function listingDescription(
  listing: NonNullable<Awaited<ReturnType<typeof getListingById>>>,
) {
  const price = listing.contactForPrice
    ? "Contact for price"
    : formatGhs(listing.priceGhs);
  const place = [listing.city, regionById(listing.regionId)?.name]
    .filter(Boolean)
    .join(", ");
  const snippet = listing.description.replace(/\s+/g, " ").trim().slice(0, 140);
  return [price, place, snippet].filter(Boolean).join(" · ");
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListingById(id);
  const origin = siteOrigin();
  const url = `${origin}/listing/${id}`;
  // Same-origin OG image so WhatsApp / Facebook can fetch it reliably.
  const ogImage = {
    url: `${origin}/listing/${id}/opengraph-image`,
    width: 1200,
    height: 630,
    alt: listing?.title || "Vendors Gram listing",
  };

  if (!listing) {
    return {
      title: "Ad not found",
      robots: { index: false, follow: false },
      openGraph: { images: [ogImage] },
    };
  }

  const category = categoryById(listing.categoryId)?.name;
  const title = listing.title;
  const description = listingDescription(listing);
  const indexable = listing.status === "live";

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: indexable
      ? { index: true, follow: true }
      : { index: false, follow: false },
    openGraph: {
      type: "website",
      url,
      title,
      description,
      siteName: "Vendors Gram",
      images: [ogImage],
      locale: "en_GH",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage.url],
    },
    other: category ? { "product:category": category } : undefined,
  };
}

function ListingJsonLd({
  listing,
}: {
  listing: NonNullable<Awaited<ReturnType<typeof getListingById>>>;
}) {
  const origin = siteOrigin();
  const price = listing.contactForPrice ? undefined : listing.priceGhs;
  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: listing.title,
    description: listing.description.slice(0, 5000),
    image: listing.photoUrls.slice(0, 8),
    category: categoryById(listing.categoryId)?.name,
    url: `${origin}/listing/${listing.id}`,
    offers: {
      "@type": "Offer",
      url: `${origin}/listing/${listing.id}`,
      priceCurrency: "GHS",
      ...(price != null ? { price: String(price) } : {}),
      availability:
        listing.status === "live"
          ? "https://schema.org/InStock"
          : "https://schema.org/SoldOut",
      itemCondition:
        listing.condition === "new"
          ? "https://schema.org/NewCondition"
          : "https://schema.org/UsedCondition",
      areaServed: listing.city || "Ghana",
    },
    brand: {
      "@type": "Brand",
      name: "Vendors Gram",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default async function ListingPage({ params }: PageProps) {
  const { id } = await params;
  const listing = await getListingById(id);

  return (
    <>
      {listing && listing.status === "live" ? (
        <ListingJsonLd listing={listing} />
      ) : null}
      <ListingPageClient listingId={id} initialListing={listing} />
    </>
  );
}
