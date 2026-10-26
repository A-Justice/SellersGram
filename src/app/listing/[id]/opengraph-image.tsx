import { ImageResponse } from "next/og";
import { getListingById } from "@/lib/server/listings";
import { formatGhs } from "@/lib/format";

export const runtime = "nodejs";
export const alt = "Vendors Gram listing";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Props = { params: Promise<{ id: string }> };

/** Serves the listing photo (or a branded fallback) for WhatsApp / social previews. */
export default async function OgImage({ params }: Props) {
  const { id } = await params;
  const listing = await getListingById(id);
  const photo = listing?.photoUrls?.[0]?.trim();

  if (photo) {
    try {
      const upstream = await fetch(photo, {
        headers: { Accept: "image/*" },
        next: { revalidate: 3600 },
      });
      if (upstream.ok) {
        const buffer = await upstream.arrayBuffer();
        const type = upstream.headers.get("content-type") || "image/jpeg";
        // Prefer returning the real product photo — WhatsApp uses this URL as og:image.
        if (type.startsWith("image/")) {
          return new Response(buffer, {
            headers: {
              "Content-Type": type,
              "Cache-Control":
                "public, immutable, no-transform, max-age=86400, stale-while-revalidate=604800",
            },
          });
        }
      }
    } catch (error) {
      console.error("OG photo fetch failed", id, error);
    }
  }

  const title = listing?.title || "Vendors Gram";
  const price = listing
    ? listing.contactForPrice
      ? "Contact for price"
      : formatGhs(listing.priceGhs)
    : "Marketplace for Campus and Beyond";
  const place = listing?.city || "Ghana";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#14110e",
          color: "#fffdf8",
          padding: 64,
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 28,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "#d4a017",
          }}
        >
          Vendors Gram
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              display: "flex",
              fontSize: title.length > 48 ? 48 : 60,
              fontWeight: 700,
              lineHeight: 1.1,
              maxWidth: 1000,
            }}
          >
            {title.slice(0, 90)}
          </div>
          <div style={{ display: "flex", fontSize: 36, color: "#0f6a4d" }}>
            {price}
          </div>
          <div style={{ display: "flex", fontSize: 28, color: "#cfc7bb" }}>
            {place}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
