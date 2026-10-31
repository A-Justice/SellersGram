import type { Viewport } from "next";
import { Outfit, Syne } from "next/font/google";
import { EnvBanner } from "@/components/EnvBanner";
import { Providers } from "@/components/Providers";
import { rootMetadata } from "@/lib/seo";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
});

export const metadata = rootMetadata();

export const viewport: Viewport = {
  themeColor: "#f4efe6",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-GH"
      className={`${outfit.variable} ${syne.variable} antialiased`}
    >
      <body className="bg-canvas text-ink">
        <EnvBanner />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
