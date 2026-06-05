"use client";

import { useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { ProjectCover } from "@/components/public/sections/projects/project-cover";

type ProjectScreenshotsProps = {
  screenshots: string[];
  title: string;
};

export function ProjectScreenshots({
  screenshots,
  title,
}: ProjectScreenshotsProps) {
  const [activeIndex, setActiveIndex] = useState(-1);

  if (screenshots.length === 0) {
    return null;
  }

  const slides = screenshots.map((screenshot, index) => ({
    src: screenshot,
    alt: `${title} screenshot ${index + 1}`,
    description: `Screenshot ${index + 1} of ${screenshots.length}`,
  }));
  const activeSlide = activeIndex >= 0 ? slides[activeIndex] : null;

  return (
    <section className="mt-14">
      <div className="mb-6 flex flex-col gap-2">
        <p className="text-xs font-semibold tracking-[0.28em] text-brand-soft uppercase">
          Screenshots
        </p>
        <h2 className="font-heading text-3xl font-semibold text-foreground">
          Interface details
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {screenshots.map((screenshot, index) => (
          <button
            key={screenshot}
            type="button"
            className="group/project rounded-3xl text-left outline-none focus-visible:ring-2 focus-visible:ring-brand-soft/60"
            onClick={() => setActiveIndex(index)}
          >
            <ProjectCover
              src={screenshot}
              alt={`${title} screenshot ${index + 1}`}
              className="aspect-[16/10] rounded-3xl shadow-[0_0_48px_rgba(139,92,246,0.08)]"
            />
          </button>
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
