import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env";

function origin() {
  return publicEnv.appUrl.replace(/\/$/, "") || "https://vendorsgram.com";
}

export default function robots(): MetadataRoute.Robots {
  const base = origin();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/account",
          "/account/",
          "/inbox",
          "/inbox/",
          "/notifications",
          "/notifications/",
          "/my-ads",
          "/my-ads/",
          "/login",
          "/login/",
          "/sell",
          "/sell/",
          "/boost",
          "/boost/",
          "/api/",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
