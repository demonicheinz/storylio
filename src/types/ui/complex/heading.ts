import type { ReactNode } from "react";

/**
 * HTML heading level (h1-h6)
 */
export type HeadingLevel = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

/**
 * Size variant for headings
 */
export type HeadingSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";

/**
 * Visual style variant for headings
 */
export type HeadingVariant = "default" | "section" | "page" | "feature";

/**
 * Props for the Heading component
 */
export interface HeadingProps {
  /** HTML heading level (h1-h6) */
  level?: HeadingLevel;
  /** Size variant of the heading */
  size?: HeadingSize;
  /** Visual style variant */
  variant?: HeadingVariant;
  /** Main heading text */
  title?: string;
  /** Highlighted portion of the heading (styled differently) */
  highlight?: string;
  /** Additional CSS classes */
  className?: string;
  /** HTML ID attribute for the heading */
  id?: string;
  /** Child elements to render inside the heading */
  children?: ReactNode;
}
