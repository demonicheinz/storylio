"use client";

import {
  ContentCover,
  type ContentCoverProps,
} from "@/components/public/content-cover";

export function ProjectCover({
  appearance = "default",
  ...props
}: ContentCoverProps) {
  return (
    <ContentCover
      {...props}
      fallback="Project preview unavailable"
      imageClassName={
        appearance === "default"
          ? "motion-safe:group-hover/project:scale-105 motion-safe:transition-transform duration-500"
          : undefined
      }
    />
  );
}
