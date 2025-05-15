"use client";

import type { UseScrollToTopOptions } from "@/types/ui";
import { useCallback, useEffect, useState } from "react";

/**
 * Hook that manages scroll-to-top functionality
 * @param options - Configuration options
 * @param options.threshold - Scroll distance in pixels before triggering visibility (default: 300)
 * @returns Object containing visibility state and scroll functions
 */
export function useScrollToTop({ threshold = 300 }: UseScrollToTopOptions = {}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  /**
   * Throttle function to limit the number of function calls
   * @param fn - Function to throttle
   * @param delay - Delay in milliseconds
   * @returns Throttled function
   */
  const throttle = <T extends (...args: unknown[]) => unknown>(fn: T, delay: number) => {
    let lastCall = 0;
    return (...args: Parameters<T>): ReturnType<T> | undefined => {
      const now = new Date().getTime();
      if (now - lastCall < delay) {
        return undefined;
      }
      lastCall = now;
      return fn(...args) as ReturnType<T>;
    };
  };

  // Show button when scroll exceeds threshold
  const toggleVisibility = useCallback(
    throttle(() => {
      if (window.scrollY > threshold) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    }, 100), // Throttle 100ms for performance
    [threshold],
  );

  /**
   * Scrolls the page to the top with a smooth animation
   */
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Event listener for scroll
  useEffect(() => {
    if (!isMounted) return;

    window.addEventListener("scroll", toggleVisibility);

    // Check scroll position when component mounts
    toggleVisibility();

    return () => window.removeEventListener("scroll", toggleVisibility);
  }, [isMounted, toggleVisibility]);

  return {
    isVisible,
    isMounted,
    scrollToTop,
  };
}
