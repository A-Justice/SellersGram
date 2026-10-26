import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  const appUrl = (
    process.env.NEXT_PUBLIC_APP_URL || "https://vendorsgram.com"
  ).replace(/\/$/, "");

  return {
    name: "Vendors Gram",
    short_name: "Vendors Gram",
    description:
      "Marketplace for Campus and Beyond. Buy, sell, and get alerts on your phone.",
    start_url: "/",
    id: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f4efe6",
    theme_color: "#f4efe6",
    lang: "en",
    categories: ["shopping", "lifestyle"],
    // Lets Chrome's getInstalledRelatedApps() detect this PWA when opened in a tab.
    related_applications: [
      {
        platform: "webapp",
        url: `${appUrl}/manifest.webmanifest`,
      },
    ],
    prefer_related_applications: false,
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
