import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Put generateMetadata in the real <head> for every request. Facebook's
  // crawler ignores streamed meta after </head> and then infers Azure WebP.
  // Match-all: App Hosting sometimes does not forward User-Agent to Next.
  // Docs: nextjs.org/docs/app/api-reference/config/next-config-js/htmlLimitedBots
  // Meta: developers.facebook.com/docs/sharing/webmasters/
  htmlLimitedBots: /.*/,
  async rewrites() {
    return [
      // Facebook prefers image URLs that end in .jpg
      {
        source: "/og/listing/:id.jpg",
        destination: "/og/listing/:id",
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.blob.core.windows.net",
        pathname: "/**",
      },
    ],
  },
  serverExternalPackages: ["sharp", "web-push"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
