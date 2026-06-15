"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";
import { z } from "zod";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

z.config({ jitless: true });

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <TooltipProvider>
        {children}
        <Toaster />
      </TooltipProvider>
    </MotionConfig>
  );
}
