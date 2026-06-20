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
      <div className="mb-7 flex flex-col gap-2 border-b border-border/30 pb-5">
        <p className="text-xs font-semibold tracking-[0.28em] text-brand-soft uppercase">
          Screenshots
        </p>
        <h2
          id="project-screenshots"
          className="font-heading text-3xl font-semibold text-foreground"
        >
          Interface details
        </h2>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:gap-6">
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
            className="group/shot overflow-hidden rounded-3xl border border-border/40 bg-surface/55 p-2.5 shadow-[0_0_48px_rgba(139,92,246,0.08)] backdrop-blur-xl"
          >
            <button
              type="button"
              className="group/project block w-full rounded-[1.2rem] text-left outline-none focus-visible:ring-2 focus-visible:ring-brand-soft/60"
              onClick={() => setActiveIndex(index)}
              aria-label={`Open ${item.altText || item.caption || `${title} screenshot ${index + 1}`}`}
            >
              {item.width && item.height ? (
                <div className="relative aspect-video w-full overflow-hidden rounded-[1.2rem] border border-border/40 bg-[radial-gradient(circle_at_20%_20%,rgba(168,85,247,0.28),transparent_34%),linear-gradient(135deg,rgba(15,23,42,0.92),rgba(49,46,129,0.28),rgba(10,10,20,0.96))]">
                  <Image
                    src={item.imageUrl}
                    alt={
                      item.altText ||
                      item.caption ||
                      `${title} screenshot ${index + 1}`
                    }
                    fill
                    className="object-cover transition-transform duration-500 group-hover/project:scale-105"
                    sizes="(min-width: 768px) 50vw, 100vw"
                    {...(item.blurDataUrl
                      ? {
                          placeholder: "blur" as const,
                          blurDataURL: item.blurDataUrl,
                        }
                      : {})}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-background/30 via-transparent to-white/5" />
                </div>
              ) : (
                <ProjectCover
                  src={item.imageUrl}
                  alt={
                    item.altText ||
                    item.caption ||
                    `${title} screenshot ${index + 1}`
                  }
                  className="aspect-video rounded-[1.2rem]"
                  sizes="(min-width: 1280px) 536px, (min-width: 768px) calc(50vw - 2.5rem), calc(100vw - 2rem)"
                />
              )}
            </button>
            {item.caption && (
              <p className="px-2 pt-3 pb-1 text-sm leading-6 text-muted-foreground">
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
              <div className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto flex max-w-3xl flex-col items-center px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-center sm:px-6 sm:pb-8">
                <div className="max-w-[calc(100vw-2rem)] rounded-2xl border border-border/40 bg-background/75 px-4 py-3 shadow-[0_0_48px_rgba(139,92,246,0.14)] backdrop-blur-xl sm:max-w-2xl sm:px-5">
                  <p className="text-xs leading-5 text-foreground sm:text-sm sm:leading-6">
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
