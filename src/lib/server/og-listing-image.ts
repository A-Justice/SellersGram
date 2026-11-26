import sharp from "sharp";
import { getListingById } from "@/lib/server/listings";

export const OG_SIZE = { width: 1200, height: 630 } as const;

async function fetchPhotoBuffer(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "image/jpeg,image/png,image/webp,image/*",
        "User-Agent": "VendorsGramOG/1.0",
      },
      signal: AbortSignal.timeout(12_000),
      next: { revalidate: 3600 },
    });
    if (!response.ok) {
      console.error("OG photo HTTP", response.status, url.slice(0, 80));
      return null;
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength < 32 || buffer.byteLength > 12 * 1024 * 1024) {
      return null;
    }
    return buffer;
  } catch (error) {
    console.error("OG photo fetch failed", error);
    return null;
  }
}

/** Brand bar only (no text) — App Hosting has no system fonts for SVG <text>. */
function brandBarSvg() {
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#14110e" stop-opacity="0"/>
      <stop offset="55%" stop-color="#14110e" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#14110e" stop-opacity="0.72"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="1200" height="630" fill="url(#fade)"/>
  <rect x="48" y="558" width="72" height="8" rx="4" fill="#d4a017"/>
  <rect x="132" y="558" width="220" height="8" rx="4" fill="#fffdf8" fill-opacity="0.85"/>
</svg>`);
}

function fallbackCardSvg() {
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#14110e"/>
  <rect x="48" y="48" width="72" height="8" rx="4" fill="#d4a017"/>
  <rect x="48" y="280" width="520" height="28" rx="8" fill="#fffdf8" fill-opacity="0.92"/>
  <rect x="48" y="328" width="360" height="20" rx="6" fill="#fffdf8" fill-opacity="0.45"/>
  <rect x="48" y="558" width="220" height="8" rx="4" fill="#d4a017"/>
</svg>`);
}

/**
 * Fast JPEG for crawlers. Photo cover + brand marks (no glyph fonts).
 * Title/price still come from og:title / og:description in the link preview.
 */
export async function buildListingOgJpeg(listingId: string): Promise<Buffer> {
  const listing = await getListingById(listingId);
  const photoUrl = listing?.photoUrls?.[0]?.trim();
  const photo = photoUrl ? await fetchPhotoBuffer(photoUrl) : null;

  if (photo) {
    try {
      return await sharp(photo)
        .rotate()
        .resize(OG_SIZE.width, OG_SIZE.height, {
          fit: "cover",
          position: "centre",
        })
        .composite([{ input: brandBarSvg(), top: 0, left: 0 }])
        .jpeg({ quality: 80, mozjpeg: true })
        .toBuffer();
    } catch (error) {
      console.error("OG sharp composite failed", error);
    }
  }

  return sharp(fallbackCardSvg()).jpeg({ quality: 80, mozjpeg: true }).toBuffer();
}

export function ogImageResponse(jpeg: Buffer) {
  return new Response(new Uint8Array(jpeg), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control":
        "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
