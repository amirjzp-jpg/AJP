import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/** AJ monogram favicon (§22). */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#08171B",
          color: "#31E8FF",
          fontSize: 34,
          fontWeight: 700,
          letterSpacing: -2,
        }}
      >
        AJ
      </div>
    ),
    size,
  );
}
