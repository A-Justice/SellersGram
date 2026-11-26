import sharp from "sharp";
import { getListingById } from "@/lib/server/listings";
import { formatGhs } from "@/lib/format";

export const OG_SIZE = { width: 1200, height: 630 } as const;

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapTitle(title: string, maxChars = 36, maxLines = 2) {
  const words = title.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars) {
      current = next;
      continue;
    }
    if (current) lines.push(current);
    current = word;
    if (lines.length >= maxLines) break;
  }
  if (current && lines.length < maxLines) lines.push(current);
  if (!lines.length) lines.push("Vendors Gram");
  return lines.map((line) =>
    line.length > maxChars ? `${line.slice(0, maxChars - 1)}…` : line,
  );
}

function overlaySvg(input: {
  title: string;
  price: string;
  place: string;
  withPhoto: boolean;
}) {
  const lines = wrapTitle(input.title);
  const titleSvg = lines
    .map(
      (line, index) =>
        `<text x="64" y="${470 + index * 52}" fill="#fffdf8" font-size="44" font-weight="700" font-family="Arial, Helvetica, sans-serif">${escapeXml(line)}</text>`,
    )
    .join("");

  const scrim = input.withPhoto
    ? `<rect x="0" y="280" width="1200" height="350" fill="url(#fade)"/>`
    : `<rect x="0" y="0" width="1200" height="630" fill="#14110e"/>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#14110e" stop-opacity="0"/>
      <stop offset="45%" stop-color="#14110e" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#14110e" stop-opacity="0.94"/>
    </linearGradient>
  </defs>
  ${scrim}
  <text x="64" y="420" fill="#d4a017" font-size="22" letter-spacing="4" font-family="Arial, Helvetica, sans-serif">VENDORS GRAM</text>
  ${titleSvg}
  <text x="64" y="580" fill="#f0c84a" font-size="30" font-family="Arial, Helvetica, sans-serif">${escapeXml(input.price)}</text>
  <text x="320" y="580" fill="rgba(255,253,248,0.75)" font-size="28" font-family="Arial, Helvetica, sans-serif">${escapeXml(input.place)}</text>
</svg>`;
}

async function fetchPhotoBuffer(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url, {
      headers: { Accept: "image/*" },
      signal: AbortSignal.timeout(10_000),
      next: { revalidate: 3600 },
    });
    if (!response.ok) return null;
    const type = response.headers.get("content-type") || "";
    if (type && !type.startsWith("image/")) return null;
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

/** Reliable JPEG for WhatsApp / Facebook / Telegram link previews. */
export async function buildListingOgJpeg(listingId: string): Promise<Buffer> {
  const listing = await getListingById(listingId);
  const title = listing?.title || "Vendors Gram";
  const price = listing
    ? listing.contactForPrice
      ? "Contact for price"
      : formatGhs(listing.priceGhs)
    : "Marketplace for Campus and Beyond";
  const place = listing?.city || "Ghana";
  const photoUrl = listing?.photoUrls?.[0]?.trim();
  const photo = photoUrl ? await fetchPhotoBuffer(photoUrl) : null;

  const overlay = Buffer.from(
    overlaySvg({
      title,
      price,
      place,
      withPhoto: Boolean(photo),
    }),
  );

  if (photo) {
    try {
      return await sharp(photo)
        .rotate()
        .resize(OG_SIZE.width, OG_SIZE.height, {
          fit: "cover",
          position: "centre",
        })
        .composite([{ input: overlay, top: 0, left: 0 }])
        .jpeg({ quality: 82, mozjpeg: true })
        .toBuffer();
    } catch (error) {
      console.error("OG sharp composite failed", error);
    }
  }

  return sharp({
    create: {
      width: OG_SIZE.width,
      height: OG_SIZE.height,
      channels: 3,
      background: "#14110e",
    },
  })
    .composite([{ input: overlay, top: 0, left: 0 }])
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
}
