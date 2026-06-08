"use client";

import { MotionConfig } from "motion/react";
import { type ReactNode, useEffect } from "react";
import { z } from "zod";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

z.config({ jitless: true });

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    const theme = storedTheme || "dark";

    document.documentElement.classList.toggle("dark", theme === "dark");
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <TooltipProvider>
        {children}
        <Toaster />
      </TooltipProvider>
    </MotionConfig>
  );
}
