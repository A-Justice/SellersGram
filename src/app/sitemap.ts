import type { MetadataRoute } from "next";
import { CATEGORIES } from "@/lib/categories";
import { publicEnv } from "@/lib/env";
import { getLiveListingsForSitemap } from "@/lib/server/listings";

/** Refresh live ad URLs periodically without a full redeploy. */
export const revalidate = 3600;

function origin() {
  return publicEnv.appUrl.replace(/\/$/, "") || "https://vendorsgram.com";
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = origin();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "hourly", priority: 1 },
    {
      url: `${base}/search`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.8,
    },
    {
      url: `${base}/safety`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${base}/acceptable-use`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.2,
    },
    {
      url: `${base}/disputes`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.2,
    },
    ...CATEGORIES.map((category) => ({
      url: `${base}/c/${category.id}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
  ];

  const live = await getLiveListingsForSitemap();
  const listingRoutes: MetadataRoute.Sitemap = live.map((item) => ({
    url: `${base}/listing/${item.id}`,
    lastModified: new Date(item.updatedAt),
    changeFrequency: "daily",
    priority: 0.9,
  }));

  return [...staticRoutes, ...listingRoutes];
}
