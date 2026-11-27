import type { Metadata } from "next";
import { categoryById } from "@/lib/categories";
import { isProductionSite } from "@/lib/env";
import {
  getListingOgFields,
  listingOgImageUrl,
  siteOrigin,
} from "@/lib/server/listing-og-meta";
import { getListingById } from "@/lib/server/listings";
import { ListingPageClient } from "./ListingPageClient";

/** Cache listing HTML/metadata briefly; client still streams live Firestore updates. */
export const revalidate = 60;

type PageProps = {
  params: Promise<{ id: string }>;
};

function listingOgImage(origin: string, id: string, alt: string) {
  const url = listingOgImageUrl(origin, id);
  return {
    url,
    secureUrl: url,
    width: 1200,
    height: 630,
    type: "image/jpeg" as const,
    alt,
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const og = await getListingOgFields(id);
  const image = listingOgImage(og.origin, id, og.alt);

  if (!og.listing) {
    return {
      title: "Ad not found",
      metadataBase: new URL(og.origin),
      robots: { index: false, follow: false },
      openGraph: {
        type: "website",
        url: og.url,
        siteName: "Vendors Gram",
        images: [image],
      },
      twitter: {
        card: "summary_large_image",
        images: [image.url],
      },
    };
  }

  const category = categoryById(og.listing.categoryId)?.name;
  const indexable = isProductionSite() && og.listing.status === "live";

  return {
    metadataBase: new URL(og.origin),
    title: og.title,
    description: og.description,
    alternates: indexable ? { canonical: og.url } : undefined,
    robots: indexable
      ? { index: true, follow: true }
      : { index: false, follow: false },
    openGraph: {
      type: "website",
      url: og.url,
      title: og.title,
      description: og.description,
      siteName: "Vendors Gram",
      locale: "en_GH",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: og.title,
      description: og.description,
      images: [image.url],
    },
    // Do not put og:* in `other` — Next emits name="og:image" (invalid). Use openGraph only.
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
      {listing ? <ListingJsonLd listing={listing} /> : null}
      <ListingPageClient listingId={id} initialListing={listing} />
    </>
  );
}
