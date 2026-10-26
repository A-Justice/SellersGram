import type { Metadata, Viewport } from "next";
import { Outfit, Syne } from "next/font/google";
import { EnvBanner } from "@/components/EnvBanner";
import { Providers } from "@/components/Providers";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    (process.env.NEXT_PUBLIC_APP_URL || "https://vendorsgram.com").replace(
      /\/$/,
      "",
    ),
  ),
  title: {
    default: "Vendors Gram — Marketplace for Campus and Beyond",
    template: "%s · Vendors Gram",
  },
  description:
    "Discover, buy and sell on campus and beyond. Student businesses, real people, one platform. Free to join.",
  applicationName: "Vendors Gram",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Vendors Gram",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    type: "website",
    siteName: "Vendors Gram",
    locale: "en_GH",
  },
};

export const viewport: Viewport = {
  themeColor: "#f4efe6",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${syne.variable} antialiased`}
    >
      <body className="bg-canvas text-ink">
        <EnvBanner />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
