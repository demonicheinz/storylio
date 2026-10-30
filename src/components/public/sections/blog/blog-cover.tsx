"use client";

import { ImageIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { useState } from "react";
import { IMAGE_QUALITY } from "@/lib/image-policy";
import { cn } from "@/lib/utils";

type BlogCoverProps = {
  src: string | null;
  alt: string;
  className?: string;
  fetchPriority?: "auto" | "high" | "low";
  loading?: "eager" | "lazy";
  sizes?: string;
  quality?: number;
  appearance?: "default" | "home";
};

export function BlogCover({
  src,
  alt,
  className,
  fetchPriority,
  loading = "lazy",
  sizes = "(min-width: 1024px) 50vw, 100vw",
  appearance = "default",
  quality = IMAGE_QUALITY.thumbnail,
}: BlogCoverProps) {
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
          quality={quality}
          fetchPriority={fetchPriority}
          loading={loading}
          className={cn(
            "object-cover",
            appearance === "default" &&
              "motion-safe:group-hover/post:scale-105 motion-safe:transition-transform duration-500",
          )}
          onError={() => setHasImageError(true)}
        />
      ) : (
        <div className="absolute inset-0 flex justify-center items-center gap-2 p-6 text-muted-foreground text-sm">
          <ImageIcon size={20} aria-hidden="true" />
          <span>Article cover unavailable</span>
        </div>
      )}
    </div>
  );
}
