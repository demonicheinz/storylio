"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import type { NavItem } from "@/types/nav-item";

export const FloatingNav = ({
  navItems,
  className,
  initiallyVisible = false,
}: {
  navItems: NavItem[];
  className?: string;
  initiallyVisible?: boolean;
}) => {
  const { scrollYProgress } = useScroll();
  const pathname = usePathname();
  const [visible, setVisible] = useState(initiallyVisible);

  useMotionValueEvent(scrollYProgress, "change", (current) => {
    // Check if current is not undefined and is a number
    if (typeof current === "number") {
      const direction = current! - scrollYProgress.getPrevious()!;

      if (scrollYProgress.get() < 0.05) {
        setVisible(false);
      } else {
        if (direction < 0) {
          setVisible(true);
        } else {
          setVisible(false);
        }
      }
    }
  });

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{
          opacity: 1,
          y: 0,
        }}
        animate={{
          y: visible ? 0 : -100,
          opacity: visible ? 1 : 0,
        }}
        transition={{
          duration: 0.2,
        }}
        className={cn(
          "flex max-w-fit fixed z-[5000] top-5 inset-x-0 mx-auto border border-border rounded-2xl bg-dark-purple/80 backdrop-blur-md shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] px-2 py-2 items-center justify-center space-x-4",
          className,
        )}
      >
        <div className="flex items-center space-x-4">
          {navItems.map((navItem) => {
            const isActive = pathname === navItem.link;
            return (
              <Link
                key={navItem.link}
                href={navItem.link}
                className={cn(
                  "relative flex items-center space-x-1 transition-all duration-200 rounded-lg px-3 py-2",
                  isActive
                    ? "bg-purple/10 text-purple"
                    : "text-neutral-50 hover:text-purple hover:bg-purple/10",
                )}
              >
                <Icon
                  name={navItem.icon}
                  size={18}
                  className="block sm:mr-1.5"
                />
                <span className="hidden sm:block font-medium text-sm">{navItem.name}</span>
                {isActive && (
                  <span className="-bottom-px absolute inset-x-0 bg-gradient-to-r from-transparent via-purple to-transparent mx-auto w-1/2 h-px" />
                )}
              </Link>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
