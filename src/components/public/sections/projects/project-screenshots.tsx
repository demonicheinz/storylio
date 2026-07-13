"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import { ProjectCover } from "@/components/public/sections/projects/project-cover";

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
        <p className="font-semibold text-brand-soft text-xs uppercase tracking-[0.28em]">
          Screenshots
        </p>
        <h2
          id="project-screenshots"
          className="font-heading font-semibold text-foreground text-3xl"
        >
          Interface details
        </h2>
      </div>

      <div className="gap-5 lg:gap-6 grid md:grid-cols-2">
        {items.map((item, index) => (
          <motion.div
            key={item.imageUrl}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{
              duration: 0.45,
              delay: Math.min(index * 0.08, 0.24),
              ease: [0.22, 1, 0.36, 1],
            }}
            className="group/shot bg-surface/55 shadow-[0_0_48px_rgba(139,92,246,0.08)] backdrop-blur-xl p-2.5 border border-border/40 rounded-3xl overflow-hidden"
          >
            <button
              type="button"
              className="group/project block rounded-[1.2rem] outline-none focus-visible:ring-2 focus-visible:ring-brand-soft/60 w-full text-left"
              onClick={() => setActiveIndex(index)}
              aria-label={`Open ${item.altText || item.caption || `${title} screenshot ${index + 1}`}`}
            >
              {item.width && item.height ? (
                <div className="relative bg-[radial-gradient(circle_at_20%_20%,rgba(168,85,247,0.28),transparent_34%),linear-gradient(135deg,rgba(15,23,42,0.92),rgba(49,46,129,0.28),rgba(10,10,20,0.96))] border border-border/40 rounded-[1.2rem] w-full aspect-video overflow-hidden">
                  <Image
                    src={item.imageUrl}
                    alt={
                      item.altText ||
                      item.caption ||
                      `${title} screenshot ${index + 1}`
                    }
                    fill
                    className="object-cover group-hover/project:scale-105 transition-transform duration-500"
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
                  className="rounded-[1.2rem] aspect-video"
                  sizes="(min-width: 1280px) 536px, (min-width: 768px) calc(50vw - 2.5rem), calc(100vw - 2rem)"
                />
              )}
            </button>
            {item.caption && (
              <p className="px-2 pt-3 pb-1 text-muted-foreground text-sm leading-6">
                {item.caption}
              </p>
            )}
          </motion.div>
        ))}
      </div>

      <Lightbox
        open={activeIndex >= 0}
        close={() => setActiveIndex(-1)}
        index={activeIndex}
        slides={slides}
        carousel={{ finite: false, imageFit: "contain" }}
        controller={{ closeOnBackdropClick: true }}
        on={{ view: ({ index }) => setActiveIndex(index) }}
        render={{
          slideFooter: () =>
            activeSlide ? (
              <div className="bottom-0 absolute inset-x-0 pb-[max(1.25rem,env(safe-area-inset-bottom))] flex flex-col items-center mx-auto px-4 sm:px-6 sm:pb-8 max-w-3xl text-center pointer-events-none">
                <div className="bg-background/75 shadow-[0_0_48px_rgba(139,92,246,0.14)] backdrop-blur-xl px-4 sm:px-5 py-3 border border-border/40 rounded-2xl max-w-[calc(100vw-2rem)] sm:max-w-2xl">
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
