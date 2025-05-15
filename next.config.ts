import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "local-origin.dev",
    "*.local-origin.dev",
    "192.168.0.11",
    "192.168.0.12",
    "192.168.0.13",
  ],
  // Add more configuration options here
};

export default nextConfig;
