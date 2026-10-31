import type { Metadata } from "next";
import { isProductionSite, publicEnv } from "@/lib/env";

export const SITE_NAME = "Vendors Gram";

/** ~60 chars — primary SERP title. */
export const DEFAULT_TITLE =
  "Vendors Gram — Campus Marketplace in Ghana";

/** ~155 chars — benefit + place + audience, no category dump. */
export const DEFAULT_DESCRIPTION =
  "Free campus marketplace in Ghana. Buy and sell phones, fashion, hostel essentials and more — chat or call sellers. Built for students and everyone beyond campus.";

export const SITE_KEYWORDS = [
  "campus marketplace Ghana",
  "buy and sell on campus",
  "student marketplace Ghana",
  "hostel essentials",
  "Vendors Gram",
  "classifieds Ghana",
  "KNUST marketplace",
  "Legon buy sell",
  "UCC campus ads",
];

export type FaqItem = { question: string; answer: string };

/** Crawlable FAQ — also powers FAQPage JSON-LD for rich results / AI Overviews. */
export const HOME_FAQS: FaqItem[] = [
  {
    question: "What is Vendors Gram?",
    answer:
      "Vendors Gram is a free online marketplace for buying and selling products and services in Ghana — starting on campus and open beyond. Post an ad, chat or call the seller, and meet in public.",
  },
  {
    question: "Is Vendors Gram free?",
    answer:
      "Yes. Joining, browsing, posting ads, chatting, and calling sellers is free. Optional boosts help ads reach more buyers; everything else stays free forever.",
  },
  {
    question: "Who is Vendors Gram for?",
    answer:
      "Students, campus businesses, and anyone in Ghana who wants a simple place to buy and sell locally. Search by region and city, then talk direct with the other person.",
  },
  {
    question: "How do I buy or sell on campus?",
    answer:
      "Browse categories or search for what you need, open an ad, then chat in the app or call. To sell, post photos, price, and place in a few steps — your ad goes live for buyers nearby.",
  },
  {
    question: "Is it safe to meet sellers?",
    answer:
      "Meet in a public place, check the item before you pay, and prefer in-app chat so you have a record. Never pay in advance for delivery you have not agreed carefully. Report anything that feels off.",
  },
];

export function siteOrigin() {
  return publicEnv.appUrl.replace(/\/$/, "") || "https://vendorsgram.com";
}

export function absoluteUrl(path = "/") {
  const base = siteOrigin();
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function jsonLdScript(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function organizationJsonLd(origin = siteOrigin()) {
  return {
    "@type": "Organization",
    "@id": `${origin}/#organization`,
    name: SITE_NAME,
    url: origin,
    logo: `${origin}/icon-192.png`,
    description: DEFAULT_DESCRIPTION,
    areaServed: {
      "@type": "Country",
      name: "Ghana",
    },
  };
}

export function websiteJsonLd(origin = siteOrigin()) {
  return {
    "@type": "WebSite",
    "@id": `${origin}/#website`,
    name: SITE_NAME,
    url: origin,
    description: DEFAULT_DESCRIPTION,
    inLanguage: "en-GH",
    publisher: { "@id": `${origin}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${origin}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function faqPageJsonLd(
  faqs: FaqItem[] = HOME_FAQS,
  origin = siteOrigin(),
) {
  return {
    "@type": "FAQPage",
    "@id": `${origin}/#faq`,
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function homeGraphJsonLd(itemList?: Record<string, unknown>) {
  const origin = siteOrigin();
  const graph: Record<string, unknown>[] = [
    organizationJsonLd(origin),
    websiteJsonLd(origin),
    faqPageJsonLd(HOME_FAQS, origin),
  ];
  if (itemList) graph.push(itemList);
  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}

export function rootMetadata(): Metadata {
  const origin = siteOrigin();
  const indexable = isProductionSite();
  return {
    metadataBase: new URL(origin),
    title: {
      default: DEFAULT_TITLE,
      template: `%s · ${SITE_NAME}`,
    },
    description: DEFAULT_DESCRIPTION,
    applicationName: SITE_NAME,
    keywords: SITE_KEYWORDS,
    authors: [{ name: SITE_NAME, url: origin }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    category: "marketplace",
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      title: SITE_NAME,
      statusBarStyle: "default",
    },
    icons: {
      icon: [
        { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
        { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      ],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    },
    alternates: {
      // Staging must not claim the production URL as canonical content twin.
      canonical: indexable ? origin : undefined,
    },
    openGraph: {
      type: "website",
      url: origin,
      siteName: SITE_NAME,
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      locale: "en_GH",
    },
    twitter: {
      card: "summary_large_image",
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
    },
    robots: indexable
      ? {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        }
      : {
          index: false,
          follow: false,
          nocache: true,
          googleBot: {
            index: false,
            follow: false,
            noimageindex: true,
          },
        },
  };
}

export function categorySeo(categoryName: string, hint: string, slug: string) {
  const origin = siteOrigin();
  const url = `${origin}/c/${slug}`;
  const title = `${categoryName} for sale in Ghana`;
  const description = `Browse ${categoryName.toLowerCase()} on Vendors Gram — ${hint}. Free campus marketplace in Ghana. Chat or call sellers near you.`;
  return { title, description, url };
}
