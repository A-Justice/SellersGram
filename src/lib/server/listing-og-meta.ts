import { categoryById } from "@/lib/categories";
import { publicEnv } from "@/lib/env";
import { formatGhs } from "@/lib/format";
import { regionById } from "@/lib/regions";
import { getListingById } from "@/lib/server/listings";

export function siteOrigin() {
  return publicEnv.appUrl.replace(/\/$/, "") || "https://vendorsgram.com";
}

/** Facebook’s parser is happier without emoji in og:description. */
export function stripForOg(text: string) {
  return text
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function listingOgImageUrl(origin: string, id: string) {
  // Real .jpg path (rewritten to /og/listing/[id]) — Facebook is unreliable
  // with extensionless App Router opengraph-image URLs.
  return `${origin}/og/listing/${id}.jpg`;
}

export function listingDescription(
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

export async function getListingOgFields(id: string) {
  const listing = await getListingById(id);
  const origin = siteOrigin();
  const url = `${origin}/listing/${id}`;
  const image = listingOgImageUrl(origin, id);

  if (!listing) {
    return {
      listing: null,
      origin,
      url,
      title: "Ad not found",
      description: "This listing is unavailable on Vendors Gram.",
      image,
      alt: "Vendors Gram listing",
    };
  }

  return {
    listing,
    origin,
    url,
    title: listing.title,
    description: listingDescription(listing),
    image,
    alt: listing.title,
  };
}
