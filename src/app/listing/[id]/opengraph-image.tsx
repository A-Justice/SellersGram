import { ImageResponse } from "next/og";
import { getListingById } from "@/lib/server/listings";
import { formatGhs } from "@/lib/format";

export const runtime = "nodejs";
export const alt = "Vendors Gram listing";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Props = { params: Promise<{ id: string }> };

async function photoAsDataUrl(photo: string): Promise<string | null> {
  try {
    const upstream = await fetch(photo, {
      headers: { Accept: "image/*" },
      next: { revalidate: 3600 },
    });
    if (!upstream.ok) return null;
    const type = upstream.headers.get("content-type") || "image/jpeg";
    if (!type.startsWith("image/")) return null;
    const buffer = Buffer.from(await upstream.arrayBuffer());
    // WhatsApp is unreliable with WebP previews — always re-encode via ImageResponse PNG.
    return `data:${type};base64,${buffer.toString("base64")}`;
  } catch (error) {
    console.error("OG photo fetch failed", error);
    return null;
  }
}

/** 1200×630 PNG for WhatsApp / Facebook (not raw product WebP). */
export default async function OgImage({ params }: Props) {
  const { id } = await params;
  const listing = await getListingById(id);
  const title = listing?.title || "Vendors Gram";
  const price = listing
    ? listing.contactForPrice
      ? "Contact for price"
      : formatGhs(listing.priceGhs)
    : "Marketplace for Campus and Beyond";
  const place = listing?.city || "Ghana";
  const photo = listing?.photoUrls?.[0]?.trim();
  const photoData = photo ? await photoAsDataUrl(photo) : null;

  if (photoData) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            background: "#14110e",
            position: "relative",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoData}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              padding: 48,
              background:
                "linear-gradient(to top, rgba(20,17,14,0.92) 0%, rgba(20,17,14,0.45) 45%, transparent 100%)",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 22,
                letterSpacing: 3,
                textTransform: "uppercase",
                color: "#d4a017",
                marginBottom: 12,
              }}
            >
              Vendors Gram
            </div>
            <div
              style={{
                display: "flex",
                fontSize: title.length > 42 ? 42 : 52,
                fontWeight: 700,
                color: "#fffdf8",
                lineHeight: 1.1,
                maxWidth: 900,
              }}
            >
              {title.slice(0, 80)}
            </div>
            <div
              style={{
                display: "flex",
                gap: 16,
                marginTop: 14,
                fontSize: 28,
                color: "#fffdf8",
              }}
            >
              <span style={{ color: "#f0c84a" }}>{price}</span>
              <span style={{ color: "rgba(255,253,248,0.7)" }}>{place}</span>
            </div>
          </div>
        </div>
      ),
      { ...size },
    );
  }

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
          <div style={{ display: "flex", fontSize: 36, color: "#f0c84a" }}>
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
