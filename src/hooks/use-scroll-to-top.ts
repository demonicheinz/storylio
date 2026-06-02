"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

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

function throttle<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number,
) {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall < delay) {
      return;
    }
    lastCall = now;
    fn(...args);
  };
}

export function useScrollToTop({
  threshold = 300,
}: UseScrollToTopOptions = {}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);
  const toggleVisibility = useMemo(
    () =>
      throttle(() => {
        setIsVisible(window.scrollY > threshold);
      }, 100),
    [threshold],
  );
  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);
  useEffect(() => {
    if (!isMounted) return;
    window.addEventListener("scroll", toggleVisibility);
    toggleVisibility();
    return () => {
      window.removeEventListener("scroll", toggleVisibility);
    };
  }, [isMounted, toggleVisibility]);
  return {
    isVisible,
    isMounted,
    scrollToTop,
  };
}
