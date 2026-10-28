"use client";

import { useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import { DepthCarousel } from "@/components/common/depth-carousel";
import { SectionHeading } from "@/components/common/section-heading";
import { useLightboxScrollLock } from "@/hooks/use-lightbox-scroll-lock";

type StructuredScreenshot = {
  imageUrl: string;
  caption?: string | null;
  altText?: string | null;
  width?: number | null;
  height?: number | null;
  blurDataUrl?: string | null;
  order: number;
};

type ProjectScreenshotsProps = {
  structuredScreenshots?: StructuredScreenshot[];
  title: string;
};

export function ProjectScreenshots({
  structuredScreenshots,
  title,
}: ProjectScreenshotsProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const scrollLock = useLightboxScrollLock();

  const items: StructuredScreenshot[] =
    structuredScreenshots && structuredScreenshots.length > 0
      ? [...structuredScreenshots].sort((a, b) => a.order - b.order)
      : [];

  if (items.length === 0) {
    return null;
  }

  const slides = items.map((item, index) => ({
    src: item.imageUrl,
    alt: item.altText || item.caption || `${title} screenshot ${index + 1}`,
    description: item.caption || `Screenshot ${index + 1} of ${items.length}`,
  }));

  return (
    <section className="mt-16 md:mt-20" aria-labelledby="project-screenshots">
      <div className="flex flex-col gap-2 mb-7 pb-5 border-border/30 border-b">
        <SectionHeading id="project-screenshots">
          Interface details
        </SectionHeading>
      </div>

      <DepthCarousel
        items={items.map((item, index) => ({
          src: item.imageUrl,
          alt: slides[index].alt,
          width: item.width,
          height: item.height,
          blurDataUrl: item.blurDataUrl,
        }))}
        index={activeIndex}
        onIndexChange={setActiveIndex}
        onSelect={(index) => {
          setActiveIndex(index);
          setLightboxOpen(true);
        }}
      />

      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={activeIndex}
        slides={slides}
        carousel={{ finite: false, imageFit: "contain" }}
        controller={{ closeOnBackdropClick: true }}
        styles={{ container: { backgroundColor: "var(--background)" } }}
        on={{ ...scrollLock, view: ({ index }) => setActiveIndex(index) }}
        render={{
          slideFooter: ({ slide }) => {
            const description =
              "description" in slide && typeof slide.description === "string"
                ? slide.description
                : "";
            return description ? (
              <div className="bottom-0 absolute inset-x-0 pb-[max(1.25rem,env(safe-area-inset-bottom))] flex flex-col items-center mx-auto px-4 sm:px-6 sm:pb-8 max-w-3xl text-center pointer-events-none">
                <div className="bg-background/95 px-4 sm:px-5 py-3 border border-border/40 rounded-lg max-w-[calc(100vw-2rem)] sm:max-w-2xl">
                  <p className="text-foreground text-xs sm:text-sm leading-5 sm:leading-6">
                    {description}
                  </p>
                </div>
              </div>
            ) : null;
          },
        }}
      />
    </section>
  );
}
