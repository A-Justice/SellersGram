import { publicEnv } from "@/lib/env";
import { formatGhs } from "@/lib/format";
import { getLiveListings } from "@/lib/server/listings";
import { HomePageClient } from "./HomePageClient";

export const revalidate = 120;

function siteOrigin() {
  return publicEnv.appUrl.replace(/\/$/, "") || "https://vendorsgram.com";
}

export default async function HomePage() {
  const live = await getLiveListings();
  const origin = siteOrigin();
  const itemList = live.slice(0, 20).map((listing, index) => ({
    "@type": "ListItem",
    position: index + 1,
    url: `${origin}/listing/${listing.id}`,
    name: listing.title,
    ...(listing.photoUrls[0] ? { image: listing.photoUrls[0] } : {}),
    ...(listing.contactForPrice
      ? {}
      : listing.priceGhs != null
        ? { description: formatGhs(listing.priceGhs) }
        : {}),
  }));

  return (
    <>
      {itemList.length ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ItemList",
              name: "Vendors Gram live ads",
              numberOfItems: itemList.length,
              itemListElement: itemList,
            }),
          }}
        />
      ) : null}
      <HomePageClient initialLive={live} />
    </>
  );
}
