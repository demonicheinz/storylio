"use client";

import { ImageIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

type BlogCoverProps = {
  src: string | null;
  alt: string;
  className?: string;
  fetchPriority?: "auto" | "high" | "low";
  loading?: "eager" | "lazy";
  sizes?: string;
};

export function BlogCover({
  src,
  alt,
  className,
  fetchPriority,
  loading = "lazy",
  sizes = "(min-width: 1024px) 50vw, 100vw",
}: BlogCoverProps) {
  const [hasImageError, setHasImageError] = useState(false);
  const shouldShowImage = Boolean(src) && !hasImageError;

  return (
    <div
      className={cn(
        "relative bg-[radial-gradient(circle_at_18%_18%,rgba(168,85,247,0.24),transparent_34%),linear-gradient(135deg,rgba(14,12,26,0.96),rgba(38,33,66,0.62),rgba(10,10,20,0.98))] border border-border/40 rounded-3xl overflow-hidden",
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
          className="object-cover group-hover/post:scale-105 transition-transform duration-500"
          onError={() => setHasImageError(true)}
        />
      ) : (
        <div className="flex flex-col justify-between p-6 h-full min-h-52">
          <div className="flex items-center gap-2">
            <div className="bg-brand-soft rounded-full size-2" />
            <div className="flex-1 bg-linear-to-r from-brand-soft/60 to-transparent h-px" />
          </div>
          <div className="space-y-3">
            <div className="bg-foreground/30 rounded-full w-4/5 h-4" />
            <div className="bg-foreground/20 rounded-full w-3/5 h-4" />
            <div className="gap-3 grid grid-cols-[1fr_0.6fr] mt-6">
              <div className="bg-foreground/10 rounded-2xl h-24" />
              <div className="place-items-center grid bg-brand-soft/15 rounded-2xl h-24 text-brand-soft">
                <ImageIcon size={26} />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="absolute inset-0 bg-linear-to-t from-background/45 via-transparent to-white/5 pointer-events-none" />
    </div>
  );
}
