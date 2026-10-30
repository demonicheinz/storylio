import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";
import { getSentryIngestOrigin } from "./src/lib/monitoring";

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
  getOrigin(process.env.UMAMI_SCRIPT_URL) ?? "https://analytics.heinz.id";
const umamiApiOrigin =
  getOrigin(process.env.UMAMI_API_URL) ?? "https://analytics.heinz.id";
const sentryOrigin =
  process.env.NEXT_PUBLIC_SENTRY_ENABLED === "true"
    ? getSentryIngestOrigin(process.env.NEXT_PUBLIC_SENTRY_DSN)
    : null;
const umamiConnectOrigins = [umamiScriptOrigin, umamiApiOrigin]
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
  `connect-src 'self' ${umamiConnectOrigins}${sentryOrigin ? ` ${sentryOrigin}` : ""}${isDev ? " ws: wss:" : ""}${isVercelPreview ? ` ${vercelPreviewConnectOrigins}` : ""}`,
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
const previewHeaders = [
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/preview/:path*",
        headers: previewHeaders,
      },
      {
        source: "/:path(forgot-password|reset-password|two-factor)",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        ],
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
};

const uploadSourceMaps =
  process.env.SENTRY_UPLOAD_SOURCEMAPS === "true" &&
  Boolean(
    process.env.SENTRY_AUTH_TOKEN &&
      process.env.SENTRY_ORG &&
      process.env.SENTRY_PROJECT,
  );

export default process.env.NEXT_PUBLIC_SENTRY_ENABLED === "true" ||
uploadSourceMaps
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: true,
      telemetry: false,
      sourcemaps: {
        disable: !uploadSourceMaps,
        deleteSourcemapsAfterUpload: true,
      },
      bundleSizeOptimizations: { excludeDebugStatements: true },
    })
  : nextConfig;
