import { ImageResponse } from "next/og";
import {
  getListingOgPayload,
  loadOgFont,
  OG_SIZE,
} from "@/lib/server/og-listing-image";

export const runtime = "nodejs";
export const alt = "Vendors Gram listing";
export const size = OG_SIZE;
export const contentType = "image/png";

type Props = { params: Promise<{ id: string }> };

/**
 * WhatsApp / Facebook / Telegram preview image.
 * - Photo is sharp-resized to a small JPEG data URL (raw Azure WebP crashed ImageResponse).
 * - Text uses an embedded Inter font (App Hosting has no Arial → “tofu” boxes).
 */
export default async function OgImage({ params }: Props) {
  const { id } = await params;
  const [{ title, price, place, photoDataUrl }, font] = await Promise.all([
    getListingOgPayload(id),
    loadOgFont(),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#14110e",
          position: "relative",
          fontFamily: "Inter",
        }}
      >
        {photoDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoDataUrl}
            alt=""
            width={OG_SIZE.width}
            height={OG_SIZE.height}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : null}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding: 48,
            background: photoDataUrl
              ? "linear-gradient(to top, rgba(20,17,14,0.92) 0%, rgba(20,17,14,0.45) 45%, transparent 100%)"
              : "#14110e",
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
              lineHeight: 1.15,
              maxWidth: 980,
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
    {
      ...OG_SIZE,
      fonts: [
        {
          name: "Inter",
          data: font,
          style: "normal",
          weight: 700,
        },
      ],
    },
  );
}
