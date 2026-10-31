import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CATEGORIES, categoryById } from "@/lib/categories";
import { isProductionSite } from "@/lib/env";
import { getLiveListings } from "@/lib/server/listings";
import {
  categorySeo,
  jsonLdScript,
  organizationJsonLd,
  siteOrigin,
  websiteJsonLd,
} from "@/lib/seo";
import { CategoryPageClient } from "./CategoryPageClient";

export const revalidate = 120;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return CATEGORIES.map((category) => ({ slug: category.id }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = categoryById(slug);
  if (!category) {
    return { title: "Category not found", robots: { index: false, follow: false } };
  }

  const { title, description, url } = categorySeo(
    category.name,
    category.hint,
    category.id,
  );
  const indexable = isProductionSite();

  return {
    title,
    description,
    alternates: indexable ? { canonical: url } : undefined,
    robots: indexable
      ? { index: true, follow: true }
      : { index: false, follow: false, nocache: true },
    openGraph: {
      type: "website",
      url,
      title,
      description,
      siteName: "Vendors Gram",
      locale: "en_GH",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const category = categoryById(slug);
  if (!category) notFound();

  const live = await getLiveListings();
  const initialLive = live.filter((listing) => listing.categoryId === slug);
  const origin = siteOrigin();
  const { title, description, url } = categorySeo(
    category.name,
    category.hint,
    category.id,
  );

  const itemList =
    initialLive.length > 0
      ? {
          "@type": "ItemList",
          name: `${category.name} on Vendors Gram`,
          description,
          numberOfItems: Math.min(initialLive.length, 20),
          itemListElement: initialLive.slice(0, 20).map((listing, index) => ({
            "@type": "ListItem",
            position: index + 1,
            url: `${origin}/listing/${listing.id}`,
            name: listing.title,
          })),
        }
      : null;

  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      organizationJsonLd(origin),
      websiteJsonLd(origin),
      {
        "@type": "CollectionPage",
        "@id": url,
        url,
        name: title,
        description,
        isPartOf: { "@id": `${origin}/#website` },
        about: category.name,
        ...(itemList ? { mainEntity: itemList } : {}),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(graph) }}
      />
      <CategoryPageClient slug={slug} initialLive={initialLive} />
    </>
  );
}
