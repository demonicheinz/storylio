"use client";

import { FloatingDots } from "@/components/effects";
import { cn } from "@/lib/utils";

type BackgroundVariant = "home" | "about" | "projects" | "blog" | "gallery";

type PublicBackgroundProps = {
  variant?: BackgroundVariant;
  className?: string;
};

const backgroundPresets = {
  home: {
    count: 42,
    speed: 0.22,
    color: "rgba(168, 85, 247, 0.34)",
    connectThreshold: 145,
    interactive: true,
    opacity: "opacity-100",
    mask: "mask-[linear-gradient(to_bottom,black_0%,black_78%,transparent_100%)]",
    minRadius: 1.1,
    maxRadius: 2.8,
    lineOpacity: 0.22,
    mouseLineOpacity: 0.42,
  },
  about: {
    count: 36,
    speed: 0.16,
    color: "rgba(168, 85, 247, 0.28)",
    connectThreshold: 140,
    interactive: true,
    opacity: "opacity-90",
    mask: "mask-[linear-gradient(to_bottom,black,transparent_96%)]",
    minRadius: 0.95,
    maxRadius: 2.5,
    lineOpacity: 0.21,
    mouseLineOpacity: 0.38,
  },
  projects: {
    count: 38,
    speed: 0.18,
    color: "rgba(99, 102, 241, 0.27)",
    connectThreshold: 140,
    interactive: true,
    opacity: "opacity-90",
    mask: "mask-[radial-gradient(circle_at_top,black,transparent_82%)]",
    minRadius: 1,
    maxRadius: 2.6,
    lineOpacity: 0.2,
    mouseLineOpacity: 0.38,
  },
  blog: {
    count: 26,
    speed: 0.12,
    color: "rgba(168, 85, 247, 0.22)",
    connectThreshold: 125,
    interactive: false,
    opacity: "opacity-80",
    mask: "mask-[linear-gradient(to_bottom,black,transparent_88%)]",
    minRadius: 0.9,
    maxRadius: 2.3,
    lineOpacity: 0.17,
    mouseLineOpacity: 0.3,
  },
  gallery: {
    count: 48,
    speed: 0.2,
    color: "rgba(236, 72, 153, 0.25)",
    connectThreshold: 150,
    interactive: true,
    opacity: "opacity-85",
    mask: "mask-[radial-gradient(circle_at_center,black,transparent_80%)]",
    minRadius: 1,
    maxRadius: 2.7,
    lineOpacity: 0.2,
    mouseLineOpacity: 0.38,
  },
} satisfies Record<
  BackgroundVariant,
  {
    count: number;
    speed: number;
    color: string;
    connectThreshold: number;
    interactive: boolean;
    opacity: string;
    mask: string;
    minRadius: number;
    maxRadius: number;
    lineOpacity: number;
    mouseLineOpacity: number;
  }
>;

export function PublicBackground({
  variant = "home",
  className,
}: PublicBackgroundProps) {
  const preset = backgroundPresets[variant];

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background",
        className,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.12),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.1),transparent_30%)]" />

      <FloatingDots
        count={preset.count}
        minRadius={preset.minRadius}
        maxRadius={preset.maxRadius}
        speed={preset.speed}
        color={preset.color}
        connectThreshold={preset.connectThreshold}
        interactive={preset.interactive}
        lineOpacity={preset.lineOpacity}
        mouseLineOpacity={preset.mouseLineOpacity}
        className={cn(preset.opacity, preset.mask)}
      />

      <div className="absolute inset-0 bg-background/15" />
    </div>
  );
}
