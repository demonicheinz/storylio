"use client";

import { ArrowLeftIcon, ArrowRightIcon, XIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { useState } from "react";
import { ProjectCover } from "@/components/public/sections/projects/project-cover";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

type ProjectScreenshotsProps = {
  screenshots: string[];
  title: string;
};

export function ProjectScreenshots({
  screenshots,
  title,
}: ProjectScreenshotsProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (screenshots.length === 0) {
    return null;
  }

  const activeScreenshot =
    activeIndex === null ? null : (screenshots[activeIndex] ?? null);
  const canNavigate = screenshots.length > 1;
  const showPrevious = () => {
    setActiveIndex((current) => {
      if (current === null) {
        return current;
      }

      return current === 0 ? screenshots.length - 1 : current - 1;
    });
  };
  const showNext = () => {
    setActiveIndex((current) => {
      if (current === null) {
        return current;
      }

      return current === screenshots.length - 1 ? 0 : current + 1;
    });
  };

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

      <Dialog
        open={activeIndex !== null}
        onOpenChange={(open) => {
          if (!open) {
            setActiveIndex(null);
          }
        }}
      >
        <DialogContent
          className="max-w-6xl gap-4 p-3 sm:p-4"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">
            {title} screenshot preview
          </DialogTitle>
          <DialogDescription className="sr-only">
            Larger preview of the selected project screenshot.
          </DialogDescription>

          <div className="relative aspect-[16/10] min-h-[260px] overflow-hidden rounded-3xl border border-border/50 bg-background">
            {activeScreenshot && (
              <Image
                src={activeScreenshot}
                alt={`${title} screenshot ${(activeIndex ?? 0) + 1}`}
                fill
                sizes="min(100vw, 1120px)"
                className="object-contain"
                unoptimized
              />
            )}
          </div>

          <div className="flex items-center justify-between gap-3 px-1">
            <p className="text-sm text-muted-foreground">
              Screenshot {(activeIndex ?? 0) + 1} of {screenshots.length}
            </p>
            <div className="flex items-center gap-2">
              {canNavigate && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={showPrevious}
                  >
                    <ArrowLeftIcon data-icon="inline-start" />
                    Previous
                  </Button>
                  <Button type="button" variant="outline" onClick={showNext}>
                    Next
                    <ArrowRightIcon data-icon="inline-end" />
                  </Button>
                </>
              )}
              <Button type="button" onClick={() => setActiveIndex(null)}>
                <XIcon data-icon="inline-start" />
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
