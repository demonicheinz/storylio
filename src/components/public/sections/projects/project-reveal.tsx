"use client";

import type { ReactNode } from "react";
import { MotionReveal } from "@/components/common";

type ProjectRevealProps = {
  children: ReactNode;
  delay?: number;
  className?: string;
};

export function ProjectReveal({
  children,
  delay = 0,
  className,
}: ProjectRevealProps) {
  return (
    <MotionReveal delay={delay} className={className}>
      {children}
    </MotionReveal>
  );
}
