import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";
const isVercelPreview = process.env.VERCEL_ENV === "preview";
const vercelLiveOrigin = "https://vercel.live";
const vercelPreviewConnectOrigins =
  "https://vercel.live wss://ws-us3.pusher.com";
function getOrigin(value: string | undefined) {
  try {
    return value ? new URL(value).origin : null;
  } catch {
    return null;
  }
}

const umamiScriptOrigin =
  getOrigin(process.env.UMAMI_SCRIPT_URL) ?? "https://cloud.umami.is";
const umamiApiOrigin = getOrigin(process.env.UMAMI_API_URL);
const umamiConnectOrigins = [
  "https://cloud.umami.is",
  "https://api.umami.is",
  "https://gateway.umami.is",
  umamiScriptOrigin,
  umamiApiOrigin,
]
  .filter((origin): origin is string => Boolean(origin))
  .filter((origin, index, origins) => origins.indexOf(origin) === index)
  .join(" ");
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} ${umamiScriptOrigin}${isVercelPreview ? ` ${vercelLiveOrigin}` : ""}`,
  "script-src-attr 'none'",
  `style-src 'self' 'unsafe-inline'${isVercelPreview ? ` ${vercelLiveOrigin}` : ""}`,
  `img-src 'self' blob: data: https://res.cloudinary.com${isVercelPreview ? " https://vercel.live https://vercel.com" : ""}`,
  `font-src 'self' data:${isVercelPreview ? " https://vercel.live https://assets.vercel.com" : ""}`,
  `connect-src 'self' ${umamiConnectOrigins}${isDev ? " ws: wss:" : ""}${isVercelPreview ? ` ${vercelPreviewConnectOrigins}` : ""}`,
  `frame-src ${isVercelPreview ? vercelLiveOrigin : "'none'"}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
};

const withMDX = createMDX({});

export default withMDX(nextConfig);
