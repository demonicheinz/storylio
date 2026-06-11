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
};

export function ProjectCover({
  src,
  alt,
  className,
  fetchPriority,
  loading = "lazy",
}: ProjectCoverProps) {
  const [hasImageError, setHasImageError] = useState(false);
  const shouldShowImage = Boolean(src) && !hasImageError;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/40 bg-[radial-gradient(circle_at_20%_20%,rgba(168,85,247,0.28),transparent_34%),linear-gradient(135deg,rgba(15,23,42,0.92),rgba(49,46,129,0.28),rgba(10,10,20,0.96))]",
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
          className="object-cover transition-transform duration-500 group-hover/project:scale-105"
          unoptimized
          onError={() => setHasImageError(true)}
        />
      ) : (
        <div className="flex h-full min-h-56 flex-col justify-between p-5">
          <div className="h-2 w-24 rounded-full bg-brand-soft/50" />
          <div className="space-y-3">
            <div className="h-3 w-3/4 rounded-full bg-foreground/35" />
            <div className="h-3 w-1/2 rounded-full bg-foreground/20" />
            <div className="grid grid-cols-3 gap-2 pt-3">
              <div className="h-16 rounded-xl bg-foreground/10" />
              <div className="grid h-16 place-items-center rounded-xl bg-brand-soft/20 text-brand-soft">
                <ImageIcon size={22} />
              </div>
              <div className="h-16 rounded-xl bg-foreground/10" />
            </div>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-background/30 via-transparent to-white/5" />
    </div>
  );
}
