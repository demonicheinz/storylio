"use client";

import type { ReactNode } from "react";
import { MotionReveal } from "@/components/common";

type BlogRevealProps = {
  children: ReactNode;
  delay?: number;
  className?: string;
};

export function BlogReveal({
  children,
  delay = 0,
  className,
}: BlogRevealProps) {
  return (
    <MotionReveal delay={delay} className={className}>
      {children}
    </MotionReveal>
  );
}
