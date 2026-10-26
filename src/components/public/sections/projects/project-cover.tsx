"use client";

import { ImageIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

type ProjectCoverProps = {
  src: string | null;
  alt: string;
  className?: string;
  fetchPriority?: "auto" | "high" | "low";
  loading?: "eager" | "lazy";
  sizes?: string;
  appearance?: "default" | "home";
};

export function ProjectCover({
  src,
  alt,
  className,
  fetchPriority,
  loading = "lazy",
  sizes = "(min-width: 1024px) 50vw, 100vw",
  appearance = "default",
}: ProjectCoverProps) {
  const [hasImageError, setHasImageError] = useState(false);
  const shouldShowImage = Boolean(src) && !hasImageError;

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        "bg-surface-2 rounded-md",
        className,
      )}
    >
      {shouldShowImage && src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          fetchPriority={fetchPriority}
          loading={loading}
          className={cn(
            "object-cover",
            appearance === "default" &&
              "motion-safe:group-hover/project:scale-105 motion-safe:transition-transform duration-500",
          )}
          onError={() => setHasImageError(true)}
        />
      ) : (
        <div className="flex items-center justify-center gap-2 p-6 min-h-40 h-full text-muted-foreground text-sm">
          <ImageIcon size={20} aria-hidden="true" />
          <span>Project preview unavailable</span>
        </div>
      )}
    </div>
  );
}
