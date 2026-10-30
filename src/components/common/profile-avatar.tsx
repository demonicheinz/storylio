"use client";

import { LiveOrb } from "@/components/common/live-orb";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { resolveAvatarSource } from "@/lib/avatar";
import { cn } from "@/lib/utils";

type ProfileAvatarProps = {
  src?: string | null;
  name?: string | null;
  size?: number;
  animated?: boolean;
  className?: string;
};

export function ProfileAvatar({
  src,
  name,
  size = 32,
  animated = false,
  className,
}: ProfileAvatarProps) {
  const source = resolveAvatarSource(src);
  const label = name ? `${name} avatar` : "Profile avatar";

  return (
    <Avatar
      className={cn("overflow-hidden", className)}
      style={{ width: size, height: size }}
    >
      {source ? <AvatarImage src={source} alt={label} /> : null}
      <AvatarFallback className="bg-transparent rounded-[inherit]">
        <LiveOrb size={size} animated={animated} label={label} />
      </AvatarFallback>
    </Avatar>
  );
}
