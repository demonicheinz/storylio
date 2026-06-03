"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

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
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
