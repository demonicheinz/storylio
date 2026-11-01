"use client";

import Image from "next/image";
import { useState } from "react";
import { ProfileAvatar } from "@/components/common/profile-avatar";
import { resolveAvatarSource } from "@/lib/avatar";
import { cn } from "@/lib/utils";

export function ProfilePhoto({
  src,
  name,
  className,
}: {
  src?: string | null;
  name: string;
  className?: string;
}) {
  const source = resolveAvatarSource(src);
  const [failedSource, setFailedSource] = useState<string>();
  if (!source || failedSource === source) {
    return (
      <ProfileAvatar name={name} size={144} animated className={className} />
    );
  }
  return (
    <Image
      src={source}
      alt={`Portrait of ${name}`}
      width={144}
      height={144}
      sizes="(max-width: 767px) 96px, 144px"
      // Other avatar hosts retain direct delivery without expanding the optimizer allowlist.
      unoptimized={
        !(
          (source.startsWith("/") && !source.startsWith("//")) ||
          source.startsWith("https://res.cloudinary.com/")
        )
      }
      decoding="async"
      className={cn("rounded-full size-36 object-cover shrink-0", className)}
      onError={() => setFailedSource(source)}
    />
  );
}
