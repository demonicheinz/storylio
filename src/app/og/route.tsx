import { ImageResponse } from "@vercel/og";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") ?? "Storylio";
  const type = searchParams.get("type") ?? "page";

  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "flex-end",
        backgroundColor: "#0a0a14",
        padding: "60px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            fontSize: "24px",
            color: "#8b5cf6",
            marginBottom: "16px",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          {type}
        </div>
        <div
          style={{
            fontSize: "64px",
            fontWeight: "bold",
            color: "#ffffff",
            lineHeight: 1.1,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: "24px",
            color: "#a0a0b0",
            marginTop: "24px",
          }}
        >
          heinz.id
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
    },
  );
}
