import { cn } from "@/lib/utils";

/** Quiet canvas for older consumers; the planet/stars belong only to Home. */
export function PublicBackground({
  variant = "home",
  className,
}: {
  variant?: "home" | "about" | "projects" | "blog" | "gallery";
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      data-public-background={variant}
      className={cn(
        "absolute inset-0 -z-10 bg-background pointer-events-none",
        className,
      )}
    />
  );
}
