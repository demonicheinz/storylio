"use client";

import Image from "next/image";
import { useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import { MotionReveal } from "@/components/common/motion";
import { SectionHeading } from "@/components/common/section-heading";
import { ProjectCover } from "@/components/public/sections/projects/project-cover";
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
  const [activeIndex, setActiveIndex] = useState(-1);
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
  const activeSlide = activeIndex >= 0 ? slides[activeIndex] : null;

  return (
    <section className="mt-16 md:mt-20" aria-labelledby="project-screenshots">
      <div className="flex flex-col gap-2 mb-7 pb-5 border-border/30 border-b">
        <SectionHeading id="project-screenshots">
          Interface details
        </SectionHeading>
      </div>

      <div className="gap-5 lg:gap-6 grid md:grid-cols-2">
        {items.map((item, index) => (
          <MotionReveal
            key={item.imageUrl}
            className="bg-surface p-3 border border-border rounded-xl overflow-hidden"
          >
            <button
              type="button"
              className="group/project block rounded-md outline-none focus-visible:ring-2 focus-visible:ring-brand-soft/60 w-full text-left"
              onClick={() => setActiveIndex(index)}
              aria-label={`Open ${item.altText || item.caption || `${title} screenshot ${index + 1}`}`}
            >
              {item.width && item.height ? (
                <div className="relative bg-surface-2 rounded-md w-full aspect-video overflow-hidden">
                  <Image
                    src={item.imageUrl}
                    alt={
                      item.altText ||
                      item.caption ||
                      `${title} screenshot ${index + 1}`
                    }
                    fill
                    className="object-contain"
                    sizes="(min-width: 768px) 50vw, 100vw"
                    {...(item.blurDataUrl
                      ? {
                          placeholder: "blur" as const,
                          blurDataURL: item.blurDataUrl,
                        }
                      : {})}
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-background/30 via-transparent to-white/5 pointer-events-none" />
                </div>
              ) : (
                <ProjectCover
                  src={item.imageUrl}
                  alt={
                    item.altText ||
                    item.caption ||
                    `${title} screenshot ${index + 1}`
                  }
                  className="rounded-md aspect-video"
                  sizes="(min-width: 1280px) 536px, (min-width: 768px) calc(50vw - 2.5rem), calc(100vw - 2rem)"
                />
              )}
            </button>
            {item.caption && (
              <p className="px-2 pt-3 pb-1 text-muted-foreground text-sm leading-6">
                {item.caption}
              </p>
            )}
          </MotionReveal>
        ))}
      </div>

      <Lightbox
        open={activeIndex >= 0}
        close={() => setActiveIndex(-1)}
        index={activeIndex}
        slides={slides}
        carousel={{ finite: false, imageFit: "contain" }}
        controller={{ closeOnBackdropClick: true }}
        on={{ ...scrollLock, view: ({ index }) => setActiveIndex(index) }}
        render={{
          slideFooter: () =>
            activeSlide ? (
              <div className="bottom-0 absolute inset-x-0 pb-[max(1.25rem,env(safe-area-inset-bottom))] flex flex-col items-center mx-auto px-4 sm:px-6 sm:pb-8 max-w-3xl text-center pointer-events-none">
                <div className="bg-background/95 px-4 sm:px-5 py-3 border border-border/40 rounded-lg max-w-[calc(100vw-2rem)] sm:max-w-2xl">
                  <p className="text-foreground text-xs sm:text-sm leading-5 sm:leading-6">
                    {activeSlide.description}
                  </p>
                </div>
              </div>
            ) : null,
        }}
      />
    </section>
  );
}
