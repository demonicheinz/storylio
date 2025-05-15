import type { HeadingSize, HeadingVariant } from "@/types/ui";

/**
 * CSS class mapping for heading sizes
 */
export const headingSizeClasses: Record<HeadingSize, string> = {
  xs: "text-lg md:text-xl lg:text-2xl",
  sm: "text-xl md:text-2xl lg:text-3xl",
  md: "text-2xl md:text-3xl lg:text-4xl",
  lg: "text-3xl md:text-4xl lg:text-5xl",
  xl: "text-4xl md:text-5xl lg:text-6xl",
  "2xl": "text-5xl md:text-6xl lg:text-7xl",
  "3xl": "text-6xl md:text-7xl lg:text-8xl",
};

/**
 * CSS class mapping for heading variants
 */
export const headingVariantClasses: Record<HeadingVariant, string> = {
  default: "font-bold mb-4",
  section: "font-bold mb-6",
  page: "font-bold mb-8 tracking-tight",
  feature: "font-semibold mb-3",
};
