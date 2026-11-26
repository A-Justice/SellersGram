import sharp from "sharp";
import { getListingById } from "@/lib/server/listings";
import { formatGhs } from "@/lib/format";

export const OG_SIZE = { width: 1200, height: 630 } as const;

export type ListingOgPayload = {
  title: string;
  price: string;
  place: string;
  /** Small JPEG data URL for next/og (avoids huge Azure WebP in ImageResponse). */
  photoDataUrl: string | null;
};

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

/** Resize/convert listing photo to a compact JPEG data URL for ImageResponse. */
export async function listingPhotoDataUrl(
  photoUrl: string,
): Promise<string | null> {
  const raw = await fetchPhotoBuffer(photoUrl);
  if (!raw) return null;
  try {
    const jpeg = await sharp(raw)
      .rotate()
      .resize(OG_SIZE.width, OG_SIZE.height, {
        fit: "cover",
        position: "centre",
      })
      .jpeg({ quality: 78, mozjpeg: true })
      .toBuffer();
    return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  } catch (error) {
    console.error("OG sharp resize failed", error);
    return null;
  }
}

export async function getListingOgPayload(
  listingId: string,
): Promise<ListingOgPayload> {
  const listing = await getListingById(listingId);
  const title = listing?.title || "Vendors Gram";
  const price = listing
    ? listing.contactForPrice
      ? "Contact for price"
      : formatGhs(listing.priceGhs)
    : "Marketplace for Campus and Beyond";
  const place = listing?.city || "Ghana";
  const photoUrl = listing?.photoUrls?.[0]?.trim();
  const photoDataUrl = photoUrl ? await listingPhotoDataUrl(photoUrl) : null;
  return { title, price, place, photoDataUrl };
}

/** Inter Regular — works in next/og (Satori) on App Hosting. */
export async function loadOgFont(): Promise<ArrayBuffer> {
  const response = await fetch(
    "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.woff",
    { next: { revalidate: 86400 } },
  );
  if (!response.ok) {
    throw new Error(`OG font download failed: ${response.status}`);
  }
  return response.arrayBuffer();
}
