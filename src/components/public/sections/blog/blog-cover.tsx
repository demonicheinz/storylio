"use client";

import {
  ContentCover,
  type ContentCoverProps,
} from "@/components/public/content-cover";

export function BlogCover({
  appearance = "default",
  ...props
}: ContentCoverProps) {
  return (
    <ContentCover
      {...props}
      fallback="Article cover unavailable"
      imageClassName={
        appearance === "default"
          ? "motion-safe:group-hover/post:scale-105 motion-safe:transition-transform duration-500"
          : undefined
      }
    />
  );
}
