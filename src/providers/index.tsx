"use client";

import { type ReactNode, useEffect } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    const theme = storedTheme || "dark";

    document.documentElement.classList.toggle("dark", theme === "dark");
  }, []);

  return <TooltipProvider>{children}</TooltipProvider>;
}
