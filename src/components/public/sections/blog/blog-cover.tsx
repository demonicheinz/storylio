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
};

export function BlogCover({
  src,
  alt,
  className,
  fetchPriority,
  loading = "lazy",
}: BlogCoverProps) {
  const [hasImageError, setHasImageError] = useState(false);
  const shouldShowImage = Boolean(src) && !hasImageError;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-border/40 bg-[radial-gradient(circle_at_18%_18%,rgba(168,85,247,0.24),transparent_34%),linear-gradient(135deg,rgba(14,12,26,0.96),rgba(38,33,66,0.62),rgba(10,10,20,0.98))]",
        className,
      )}
    >
      {shouldShowImage && src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          fetchPriority={fetchPriority}
          loading={loading}
          className="object-cover transition-transform duration-500 group-hover/post:scale-105"
          unoptimized
          onError={() => setHasImageError(true)}
        />
      ) : (
        <div className="flex h-full min-h-52 flex-col justify-between p-6">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-brand-soft" />
            <div className="h-px flex-1 bg-gradient-to-r from-brand-soft/60 to-transparent" />
          </div>
          <div className="space-y-3">
            <div className="h-4 w-4/5 rounded-full bg-foreground/30" />
            <div className="h-4 w-3/5 rounded-full bg-foreground/20" />
            <div className="mt-6 grid grid-cols-[1fr_0.6fr] gap-3">
              <div className="h-24 rounded-2xl bg-foreground/10" />
              <div className="grid h-24 place-items-center rounded-2xl bg-brand-soft/15 text-brand-soft">
                <ImageIcon size={26} />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/45 via-transparent to-white/5" />
    </div>
  );
}
