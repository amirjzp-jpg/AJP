import { ImageResponse } from "next/og";
import { SITE } from "@/data/content";

export const alt = `${SITE.founderName} — ${SITE.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Hero frame of VARA at night with the wordmark (§22) — pure JSX skyline. */
export default function OgImage() {
  // Deterministic pseudo-random skyline
  const towers = Array.from({ length: 26 }, (_, i) => {
    const seed = ((i * 2654435761) % 97) / 97;
    const h = 60 + seed * 250 + (i === 13 ? 160 : 0); // center spire tallest
    const hues = ["#31E8FF", "#FF4FD8", "#FFB25E"];
    return { h, w: 26 + (seed * 20) % 18, hue: hues[i % 3], lit: seed > 0.3 };
  });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(180deg, #04090C 0%, #08171B 55%, #0E2B33 100%)",
          position: "relative",
        }}
      >
        {/* Skyline */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            gap: 8,
            padding: "0 40px",
          }}
        >
          {towers.map((t, i) => (
            <div
              key={i}
              style={{
                width: t.w,
                height: t.h,
                background: "#0E2B33",
                borderTop: `3px solid ${t.lit ? t.hue : "#1B2328"}`,
                boxShadow: t.lit ? `0 -6px 24px ${t.hue}55` : "none",
                display: "flex",
              }}
            />
          ))}
        </div>
        {/* Copy */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: 120,
          }}
        >
          <div
            style={{
              fontSize: 30,
              letterSpacing: 22,
              color: "#31E8FF",
              display: "flex",
            }}
          >
            {SITE.cityName}
          </div>
          <div
            style={{
              fontSize: 74,
              color: "#F7F7F7",
              marginTop: 28,
              fontWeight: 700,
              display: "flex",
            }}
          >
            {SITE.founderName}
          </div>
          <div
            style={{
              fontSize: 28,
              letterSpacing: 8,
              color: "#D7D9DB",
              marginTop: 20,
              display: "flex",
            }}
          >
            {SITE.tagline.toUpperCase()}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
