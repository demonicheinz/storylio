"use client";

import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export type FloatingNavItem = {
  icon?: ReactNode;
  name: string;
  link: string;
};

export const FloatingNav = ({
  navItems,
  className,
  initiallyVisible = true,
}: {
  navItems: FloatingNavItem[];
  className?: string;
  initiallyVisible?: boolean;
}) => {
  const pathname = usePathname();
  const { scrollYProgress } = useScroll();
  const [visible, setVisible] = useState(initiallyVisible);

  useMotionValueEvent(scrollYProgress, "change", (current) => {
    if (typeof current === "number") {
      const direction = current - (scrollYProgress.getPrevious() ?? 0);

      if (scrollYProgress.get() < 0.05) {
        setVisible(true);
      } else if (direction < 0) {
        setVisible(true);
      } else if (direction > 0) {
        setVisible(false);
      }
    }
  });

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{
          opacity: 1,
          y: -100,
        }}
        animate={{
          y: visible ? 0 : -100,
          opacity: visible ? 1 : 0,
        }}
        transition={{
          duration: 0.2,
        }}
        className={cn(
          "top-5 z-50 fixed inset-x-0 flex justify-center items-center mx-auto max-w-fit",
          className,
        )}
      >
        <div className="flex justify-center items-center gap-4 bg-card/80 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] backdrop-blur-md px-2 py-2 border rounded-2xl">
          <div className="flex items-center gap-2">
            {navItems.map((navItem) => {
              const isActive =
                navItem.link === "/"
                  ? pathname === "/"
                  : pathname.startsWith(navItem.link);

              return (
                <Link
                  key={navItem.link}
                  href={navItem.link}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "relative flex items-center gap-1 px-3 py-2 rounded-2xl font-bold text-foreground text-sm transition-all duration-200",
                    isActive
                      ? "bg-brand-soft/10 text-brand-soft"
                      : "text-neutral-50 hover:bg-brand-soft/10 hover:text-brand-soft",
                  )}
                >
                  {navItem.icon && (
                    <span className="flex justify-center items-center sm:mr-1.5 size-4.5 [&>svg]:size-4.5">
                      {navItem.icon}
                    </span>
                  )}
                  <span className="hidden sm:block">{navItem.name}</span>
                  {isActive && (
                    <span className="-bottom-px absolute inset-x-0 bg-linear-to-r from-transparent via-brand-soft to-transparent mx-auto w-1/2 h-px" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
