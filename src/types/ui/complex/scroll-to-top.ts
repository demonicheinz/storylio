/**
 * Props for the ScrollToTop component
 */
export interface ScrollToTopProps {
  /** Scroll distance before button appears (px) */
  threshold?: number;
  /** Button position on screen */
  position?: "right" | "left";
  /** Button size */
  size?: "sm" | "md" | "lg";
  /** Icon size in pixels */
  iconSize?: number;
  /** Optional background color */
  color?: string;
  /** Whether to display on mobile devices */
  showOnMobile?: boolean;
}

/**
 * Options for the useScrollToTop hook
 */
export interface UseScrollToTopOptions {
  /** Scroll distance threshold in pixels */
  threshold?: number;
}
