"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

interface ScrollToTopProps {
  // Jarak scroll sebelum tombol muncul (px)
  threshold?: number;
  // Posisi tombol di layar
  position?: "right" | "left";
  // Ukuran tombol
  size?: "sm" | "md" | "lg";
  // Ukuran ikon
  iconSize?: number;
  // Warna latar belakang (opsional)
  color?: string;
  // Tampilkan pada perangkat mobile
  showOnMobile?: boolean;
}

export default function ScrollToTop({
  threshold = 300,
  position = "right",
  size = "md",
  iconSize = 20,
  color,
  showOnMobile = true,
}: ScrollToTopProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const buttonSizeOptions = {
    sm: "w-10 h-10 p-2",
    md: "w-12 h-12 p-3",
    lg: "w-14 h-14 p-3",
  };
  const buttonSize = buttonSizeOptions[size];

  // Perbaikan untuk posisi tombol
  const buttonPositionOptions = {
    right: "right-6 left-auto",
    left: "left-6 right-auto",
  };
  const buttonPosition = buttonPositionOptions[position];

  // Fungsi throttle untuk membatasi jumlah pemanggilan
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

  // Tampilkan tombol ketika scroll melebihi threshold
  const toggleVisibility = useCallback(
    throttle(() => {
      if (window.scrollY > threshold) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    }, 100), // Throttle 100ms untuk performa
    [threshold],
  );

  // Scroll ke atas ketika tombol diklik
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Event listener untuk scroll
  useEffect(() => {
    if (!isMounted) return;

    window.addEventListener("scroll", toggleVisibility);

    // Periksa posisi scroll saat komponen dimount
    toggleVisibility();

    return () => window.removeEventListener("scroll", toggleVisibility);
  }, [isMounted, toggleVisibility]);

  // Jangan render apa pun saat komponen belum dimount
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
