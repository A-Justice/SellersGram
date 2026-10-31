import type { Metadata } from "next";
import { isProductionSite } from "@/lib/env";
import { siteOrigin } from "@/lib/seo";

const indexable = isProductionSite();

export const metadata: Metadata = {
  title: "Search ads in Ghana",
  description:
    "Search live campus and local ads on Vendors Gram. Filter by region and city across Ghana — chat or call sellers.",
  alternates: indexable
    ? { canonical: `${siteOrigin()}/search` }
    : undefined,
  robots: indexable
    ? { index: true, follow: true }
    : { index: false, follow: false, nocache: true },
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
