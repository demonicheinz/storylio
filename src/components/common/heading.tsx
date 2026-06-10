import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type HeadingLevel = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

export type HeadingSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";

export type HeadingVariant = "default" | "section" | "page" | "feature";

export interface HeadingProps {
  level?: HeadingLevel;
  size?: HeadingSize;
  variant?: HeadingVariant;
  title?: string;
  highlight?: string;
  className?: string;
  id?: string;
  children?: ReactNode;
}

export const headingSizeClasses: Record<HeadingSize, string> = {
  xs: "text-lg md:text-xl lg:text-2xl",
  sm: "text-xl md:text-2xl lg:text-3xl",
  md: "text-2xl md:text-3xl lg:text-4xl",
  lg: "text-3xl md:text-4xl lg:text-5xl",
  xl: "text-4xl md:text-5xl lg:text-6xl",
  "2xl": "text-5xl md:text-6xl lg:text-7xl",
  "3xl": "text-6xl md:text-7xl lg:text-8xl",
};

export const headingVariantClasses: Record<HeadingVariant, string> = {
  default: "font-bold mb-4",
  section: "font-bold mb-6",
  page: "font-bold mb-8 tracking-tight",
  feature: "font-semibold mb-3",
};

export function Heading({
  level = "h2",
  size = "lg",
  variant = "default",
  title,
  highlight,
  className,
  id,
  children,
}: HeadingProps) {
  const Component: ElementType = level;

  return (
    <Component
      id={id}
      className={cn(
        headingVariantClasses[variant],
        headingSizeClasses[size],
        className,
      )}
    >
      {title && (
        <span
          className={
            variant === "section"
              ? "relative inline-block border-b-2 border-brand-soft pb-1 after:absolute after:-bottom-0.5 after:left-0 after:h-0.5 after:w-full after:bg-linear-to-r after:from-border after:via-brand-soft after:to-border"
              : ""
          }
        >
          {title}{" "}
          {highlight && <span className="text-brand-soft">{highlight}</span>}
        </span>
      )}
      {children}
    </Component>
  );
}
