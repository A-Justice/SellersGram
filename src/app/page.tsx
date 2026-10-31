import type { Metadata } from "next";
import { formatGhs } from "@/lib/format";
import { getLiveListings } from "@/lib/server/listings";
import { isProductionSite } from "@/lib/env";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  homeGraphJsonLd,
  jsonLdScript,
  siteOrigin,
} from "@/lib/seo";
import { HomePageClient } from "./HomePageClient";

export const revalidate = 120;

const indexable = isProductionSite();

export const metadata: Metadata = {
  title: { absolute: DEFAULT_TITLE },
  description: DEFAULT_DESCRIPTION,
  alternates: indexable ? { canonical: siteOrigin() } : undefined,
  robots: indexable
    ? { index: true, follow: true }
    : { index: false, follow: false, nocache: true },
  openGraph: {
    type: "website",
    url: siteOrigin(),
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    siteName: "Vendors Gram",
    locale: "en_GH",
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
};

export default async function HomePage() {
  const live = await getLiveListings();
  const origin = siteOrigin();
  const itemList =
    live.length > 0
      ? {
          "@type": "ItemList",
          "@id": `${origin}/#live-ads`,
          name: "Live ads on Vendors Gram",
          description:
            "Fresh campus and local listings across Ghana on Vendors Gram.",
          numberOfItems: Math.min(live.length, 20),
          itemListElement: live.slice(0, 20).map((listing, index) => ({
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
          })),
        }
      : undefined;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(homeGraphJsonLd(itemList)),
        }}
      />
      <HomePageClient initialLive={live} />
    </>
  );
}
