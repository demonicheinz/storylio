import Script from "next/script";
import { Suspense } from "react";
import { Footer } from "@/components/common/footer";
import { PublicChrome } from "@/components/common/public-chrome";
import { Providers } from "@/providers";

function UmamiTrackingScript() {
  const websiteId =
    process.env.UMAMI_WEBSITE_ID?.trim() ??
    process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID?.trim();
  const scriptUrl =
    process.env.UMAMI_SCRIPT_URL?.trim() || "https://cloud.umami.is/script.js";
  const trackLocalhost = process.env.UMAMI_TRACK_LOCALHOST === "true";

  if (
    !websiteId ||
    (process.env.NODE_ENV !== "production" && !trackLocalhost)
  ) {
    return null;
  }

  return (
    <Script
      src={scriptUrl}
      data-website-id={websiteId}
      strategy="afterInteractive"
    />
  );
}

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <UmamiTrackingScript />
      <Suspense fallback={null}>
        <Providers>
          <PublicChrome footer={<Footer />}>{children}</PublicChrome>
        </Providers>
      </Suspense>
    </>
  );
}
