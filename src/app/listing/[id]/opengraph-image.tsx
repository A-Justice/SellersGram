import { buildListingOgJpeg, OG_SIZE } from "@/lib/server/og-listing-image";

export const runtime = "nodejs";
export const alt = "Vendors Gram listing";
export const size = OG_SIZE;
export const contentType = "image/jpeg";

type Props = { params: Promise<{ id: string }> };

/**
 * Social crawlers (WhatsApp, Facebook, Telegram, X) fetch this URL from og:image.
 * We return a real JPEG via sharp — ImageResponse + huge Azure WebP data-URLs
 * was crashing App Hosting (503), so previews never showed.
 */
export default async function OgImage({ params }: Props) {
  const { id } = await params;
  const jpeg = await buildListingOgJpeg(id);
  // Uint8Array satisfies BodyInit; Node Buffer does not under Next's TS types.
  return new Response(new Uint8Array(jpeg), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
