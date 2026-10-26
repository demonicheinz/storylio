"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Keep the new Home footer scoped while the remaining public pages are redesigned. */
export function FooterVariant({
  children,
  home,
}: {
  children: ReactNode;
  home: ReactNode;
}) {
  return usePathname() === "/" ? home : children;
}
