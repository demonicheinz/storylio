"use client";

import { ImageIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { MediaItem } from "../types";

export function MediaThumbnail({
  item,
  contain = false,
  sizes = "(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw",
}: {
  item: MediaItem;
  contain?: boolean;
  sizes?: string;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [item.url]);
  if (failed)
    return (
      <div
        className="flex justify-center items-center gap-2 h-full text-muted-foreground text-xs"
        role="img"
        aria-label={`Preview unavailable for ${item.filename}`}
      >
        <ImageIcon className="size-6" aria-hidden />
        <span>Preview unavailable</span>
      </div>
    );
  return (
    <Image
      src={item.url}
      alt={item.filename}
      fill
      className={contain ? "object-contain" : "object-cover"}
      sizes={sizes}
      onError={() => setFailed(true)}
    />
  );
}
