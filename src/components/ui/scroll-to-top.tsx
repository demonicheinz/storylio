"use client";

import { Icon } from "@/components/ui";
import { useScrollToTop } from "@/hooks";
import { cn } from "@/lib/utils";
import type { ScrollToTopProps } from "@/types/ui";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Scroll to top button component that appears when the user scrolls down
 * @param threshold - Scroll distance in pixels before the button appears (default: 300)
 * @param position - Button position on screen, either "right" or "left" (default: "right")
 * @param size - Button size variant: "sm", "md", or "lg" (default: "md")
 * @param iconSize - Size of the chevron icon in pixels (default: 20)
 * @param color - Optional custom background color
 * @param showOnMobile - Whether to display the button on mobile devices (default: true)
 * @returns A scroll-to-top button with animation
 */
export function ScrollToTop({
  threshold = 300,
  position = "right",
  size = "md",
  iconSize = 20,
  color,
  showOnMobile = true,
}: ScrollToTopProps) {
  const { isVisible, isMounted, scrollToTop } = useScrollToTop({ threshold });

  const buttonSizeOptions = {
    sm: "w-10 h-10 p-2",
    md: "w-12 h-12 p-3",
    lg: "w-14 h-14 p-3",
  };
  const buttonSize = buttonSizeOptions[size];

  // Button position configuration
  const buttonPositionOptions = {
    right: "right-6 left-auto",
    left: "left-6 right-auto",
  };
  const buttonPosition = buttonPositionOptions[position];

  // Don't render anything when component is not mounted
  if (!isMounted) return null;

  // Custom background color style
  const bgColorStyle = color ? { backgroundColor: color } : {};

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          onClick={scrollToTop}
          className={cn(
            "fixed bottom-6",
            buttonPosition,
            buttonSize,
            "bg-stt/75 hover:bg-stt border border-stt",
            "hover:border-border-secondary/40 text-accent-foreground rounded-full",
            "shadow-lg z-50 flex items-center justify-center cursor-pointer",
            "focus:outline-none focus:ring-2 focus:ring-accent-foreground focus:ring-opacity-50",
            !showOnMobile ? "hidden md:flex" : "flex",
          )}
          style={bgColorStyle}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{
            duration: 0.3,
            type: "spring",
            stiffness: 300,
            damping: 15,
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          aria-label="Scroll to top"
          title="Scroll to top"
        >
          <Icon
            name="chevronUp"
            size={iconSize}
          />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
