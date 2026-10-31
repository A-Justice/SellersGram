import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "Vendors Gram — Campus Marketplace in Ghana";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Default social preview for the homepage and pages without their own OG image. */
export default function OgImage() {
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
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              display: "flex",
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.05,
              maxWidth: 900,
            }}
          >
            Marketplace for Campus and Beyond
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              color: "rgba(255,253,248,0.72)",
              maxWidth: 820,
            }}
          >
            Free to join · Buy and sell in Ghana · Chat or call sellers
          </div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 22,
            color: "rgba(255,253,248,0.55)",
          }}
        >
          vendorsgram.com
        </div>
      </div>
    ),
    { ...size },
  );
}
