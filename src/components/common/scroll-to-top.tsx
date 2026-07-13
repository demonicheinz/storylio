"use client";

import { CaretUpIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useScrollToTop } from "@/hooks/use-scroll-to-top";
import { cn } from "@/lib/utils";

export interface ScrollToTopProps {
  threshold?: number;
  position?: "right" | "left";
  size?: "sm" | "md" | "lg";
  iconSize?: number;
  color?: string;
  showOnMobile?: boolean;
}
export interface UseScrollToTopOptions {
  threshold?: number;
}

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
            "bottom-6 fixed",
            buttonPosition,
            buttonSize,
            "border bg-surface/90 hover:bg-surface-hover",
            "rounded-full text-accent-foreground hover:border-border/60",
            "z-50 flex cursor-pointer items-center justify-center shadow-lg",
            "focus:ring-opacity-50 focus:ring-2 focus:ring-accent-foreground focus:outline-none",
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
          <CaretUpIcon size={iconSize} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
