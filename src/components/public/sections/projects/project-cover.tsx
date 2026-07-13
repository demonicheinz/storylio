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
};

export function ProjectCover({
  src,
  alt,
  className,
  fetchPriority,
  loading = "lazy",
  sizes = "(min-width: 1024px) 50vw, 100vw",
}: ProjectCoverProps) {
  const [hasImageError, setHasImageError] = useState(false);
  const shouldShowImage = Boolean(src) && !hasImageError;

  return (
    <div
      className={cn(
        "relative bg-[radial-gradient(circle_at_20%_20%,rgba(168,85,247,0.28),transparent_34%),linear-gradient(135deg,rgba(15,23,42,0.92),rgba(49,46,129,0.28),rgba(10,10,20,0.96))] border border-border/40 rounded-2xl overflow-hidden",
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
          className="object-cover group-hover/project:scale-105 transition-transform duration-500"
          onError={() => setHasImageError(true)}
        />
      ) : (
        <div className="flex flex-col justify-between p-5 h-full min-h-56">
          <div className="bg-brand-soft/50 rounded-full w-24 h-2" />
          <div className="space-y-3">
            <div className="bg-foreground/35 rounded-full w-3/4 h-3" />
            <div className="bg-foreground/20 rounded-full w-1/2 h-3" />
            <div className="gap-2 grid grid-cols-3 pt-3">
              <div className="bg-foreground/10 rounded-xl h-16" />
              <div className="place-items-center grid bg-brand-soft/20 rounded-xl h-16 text-brand-soft">
                <ImageIcon size={22} />
              </div>
              <div className="bg-foreground/10 rounded-xl h-16" />
            </div>
          </div>
        </div>
      )}

      <div className="absolute inset-0 bg-linear-to-t from-background/30 via-transparent to-white/5 pointer-events-none" />
    </div>
  );
}
