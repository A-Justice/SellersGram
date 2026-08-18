import type { Metadata } from "next";
import { Outfit, Syne } from "next/font/google";
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
  title: {
    default: "Sellers Gram — Buy and sell in Ghana",
    template: "%s · Sellers Gram",
  },
  description:
    "Post an ad, browse listings, and chat or call the seller. Classifieds for Ghana.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${syne.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-canvas text-ink">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
