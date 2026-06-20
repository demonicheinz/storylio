import { Suspense } from "react";
import { Footer } from "@/components/common/footer";
import { PublicChrome } from "@/components/common/public-chrome";
import { Providers } from "@/providers";

export default function PreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <Providers>
        <PublicChrome>
          {children}
          <Footer />
        </PublicChrome>
      </Providers>
    </Suspense>
  );
}
