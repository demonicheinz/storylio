"use client";

import { ImageIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { useState } from "react";
import { IMAGE_QUALITY } from "@/lib/image-policy";
import { cn } from "@/lib/utils";

export type ContentCoverProps = {
  src: string | null;
  alt: string;
  className?: string;
  fetchPriority?: "auto" | "high" | "low";
  loading?: "eager" | "lazy";
  sizes?: string;
  quality?: number;
  appearance?: "default" | "home";
};

type CoverImageProps = Omit<ContentCoverProps, "className" | "appearance"> & {
  fallback: string;
  imageClassName?: string;
};

function CoverImage({
  src,
  alt,
  fallback,
  imageClassName,
  fetchPriority,
  loading = "lazy",
  sizes = "(min-width: 1024px) 50vw, 100vw",
  quality = IMAGE_QUALITY.thumbnail,
}: CoverImageProps) {
  const [failed, setFailed] = useState(false);
  if (!src || failed)
    return (
      <div className="absolute inset-0 flex justify-center items-center gap-2 p-6 text-muted-foreground text-sm">
        <ImageIcon size={20} aria-hidden="true" />
        <span>{fallback}</span>
      </div>
    );
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      quality={quality}
      fetchPriority={fetchPriority}
      loading={loading}
      className={cn("object-cover", imageClassName)}
      onError={() => setFailed(true)}
    />
  );
}

export function ContentCover({
  className,
  fallback,
  imageClassName,
  ...imageProps
}: Omit<ContentCoverProps, "appearance"> &
  Pick<CoverImageProps, "fallback" | "imageClassName">) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-surface-2 rounded-md",
        className,
      )}
    >
      {/* A different source gets a fresh load/error lifecycle. */}
      <CoverImage
        key={imageProps.src}
        {...imageProps}
        fallback={fallback}
        imageClassName={imageClassName}
      />
    </div>
  );
}
