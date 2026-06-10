"use client";

import { PlusIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { type ReactNode, useEffect, useState } from "react";

export interface CardProps {
  title: string;
  icon: ReactNode;
  children?: ReactNode;
  des: string;
}

export const Card = ({ title, icon, children, des }: CardProps) => {
  const [active, setActive] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Deteksi mobile dengan useEffect
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia("(max-width: 768px)").matches);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Handlers untuk interaksi
  const handleMouseEnter = () => !isMobile && setActive(true);
  const handleMouseLeave = () => !isMobile && setActive(false);
  const handleClick = () => isMobile && setActive(!active);

  return (
    <div className="group/canvas-card relative mx-auto w-full max-w-md sm:w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] lg:w-[calc(33.333%-1.5rem)]">
      {/* Plus icons positioned absolutely relative to the container */}
      <PlusIcon
        size={40}
        className="pointer-events-none absolute -top-3 -left-3 z-10 text-gray-400 opacity-30 dark:text-white/40"
      />
      <PlusIcon
        size={40}
        className="pointer-events-none absolute -bottom-3 -left-3 z-10 text-gray-400 opacity-30 dark:text-white/40"
      />
      <PlusIcon
        size={40}
        className="pointer-events-none absolute -top-3 -right-3 z-10 text-gray-400 opacity-30 dark:text-white/40"
      />
      <PlusIcon
        size={40}
        className="pointer-events-none absolute -right-3 -bottom-3 z-10 text-gray-400 opacity-30 dark:text-white/40"
      />

      {/* Main card content */}
      <button
        type="button"
        aria-pressed={active}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className="flex aspect-3/4 h-full w-full cursor-pointer items-center justify-center overflow-hidden rounded-3xl border border-gray-200 bg-white p-4 shadow-sm dark:border-border/40 dark:bg-card"
      >
        <AnimatePresence>
          {active && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: "easeOut",
              }}
              className="absolute inset-0 h-full w-full"
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative z-20 flex h-full w-full flex-col items-center justify-center">
          <motion.div
            animate={{
              opacity: active ? 0 : 1,
              y: active ? -5 : 0,
              // Hilangkan scale untuk mengurangi efek bouncy
            }}
            transition={{
              duration: 0.25,
              ease: [0.4, 0, 0.2, 1], // Material design ease
              type: "tween", // Memastikan menggunakan tween, bukan spring
            }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          >
            {icon}
          </motion.div>

          <AnimatePresence>
            {active && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{
                  duration: 0.3,
                  delay: 0.05, // Kecil saja delaynya, agar tidak terlalu kentara
                  ease: [0.4, 0, 0.2, 1], // Material design ease
                  type: "tween",
                }}
                className="px-6 text-center"
              >
                <h2 className="text-2xl font-bold text-white md:text-3xl">
                  {title}
                </h2>
                <p className="mt-4 max-w-prose text-sm text-white">{des}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </button>
    </div>
  );
};
