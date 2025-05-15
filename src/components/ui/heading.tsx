import { headingSizeClasses, headingVariantClasses } from "@/data";
import { cn } from "@/lib/utils";
import type { HeadingProps } from "@/types/ui";
import type { ElementType } from "react";

/**
 * Responsive heading component with various size and style options
 */
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
      className={cn(headingVariantClasses[variant], headingSizeClasses[size], className)}
    >
      {title && (
        <span
          className={
            variant === "section"
              ? "inline-block border-b-2 border-purple pb-1 relative after:absolute after:bottom-[-2px] after:left-0 after:w-full after:h-[2px] after:bg-gradient-to-r after:from-border after:via-purple after:to-border"
              : ""
          }
        >
          {title} {highlight && <span className="text-purple">{highlight}</span>}
        </span>
      )}
      {children}
    </Component>
  );
}
