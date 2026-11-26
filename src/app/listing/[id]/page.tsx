import type { Metadata } from "next";
import { categoryById } from "@/lib/categories";
import { isProductionSite, publicEnv } from "@/lib/env";
import { formatGhs } from "@/lib/format";
import { regionById } from "@/lib/regions";
import { getListingById } from "@/lib/server/listings";
import { ListingPageClient } from "./ListingPageClient";

/** Cache listing HTML/metadata briefly; client still streams live Firestore updates. */
export const revalidate = 60;

type PageProps = {
  params: Promise<{ id: string }>;
};

function siteOrigin() {
  return publicEnv.appUrl.replace(/\/$/, "") || "https://vendorsgram.com";
}

/** Facebook’s parser is happier without emoji in og:description. */
function stripForOg(text: string) {
  return text
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function listingDescription(
  listing: NonNullable<Awaited<ReturnType<typeof getListingById>>>,
) {
  const price = listing.contactForPrice
    ? "Contact for price"
    : formatGhs(listing.priceGhs).replace("GH₵", "GHS");
  const place = [listing.city, regionById(listing.regionId)?.name]
    .filter(Boolean)
    .join(", ");
  const category = categoryById(listing.categoryId)?.name;
  const snippet = stripForOg(listing.description).slice(0, 110);
  return [price, place, category, snippet, "Vendors Gram"]
    .filter(Boolean)
    .join(" · ")
    .slice(0, 160);
}

function listingOgImage(origin: string, id: string, alt: string) {
  // Dedicated API path — absolute HTTPS JPEG. Meta wants og:image as an image URL object.
  const url = `${origin}/api/og/listing/${id}`;
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
  const listing = await getListingById(id);
  const origin = siteOrigin();
  const url = `${origin}/listing/${id}`;
  const alt = listing?.title || "Vendors Gram listing";
  const image = listingOgImage(origin, id, alt);

  if (!listing) {
    return {
      title: "Ad not found",
      metadataBase: new URL(origin),
      robots: { index: false, follow: false },
      openGraph: {
        type: "website",
        url,
        siteName: "Vendors Gram",
        images: [image],
      },
      twitter: {
        card: "summary_large_image",
        images: [image.url],
      },
    };
  }

  const category = categoryById(listing.categoryId)?.name;
  const title = listing.title;
  const description = listingDescription(listing);
  const indexable = isProductionSite() && listing.status === "live";

  return {
    metadataBase: new URL(origin),
    title,
    description,
    alternates: indexable ? { canonical: url } : undefined,
    robots: indexable
      ? { index: true, follow: true }
      : { index: false, follow: false },
    openGraph: {
      type: "website",
      url,
      title,
      description,
      siteName: "Vendors Gram",
      locale: "en_GH",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image.url],
    },
    // Belt-and-suspenders for crawlers that only look at flat og:* properties.
    other: {
      "og:image": image.url,
      "og:image:secure_url": image.url,
      "og:image:type": "image/jpeg",
      "og:image:width": "1200",
      "og:image:height": "630",
      ...(category ? { "product:category": category } : {}),
    },
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
