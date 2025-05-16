"use client";

import { Icon } from "@/components/ui";
import type { CardProps } from "@/types/ui";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

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
    <div className="group/canvas-card relative mx-auto w-full sm:w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] lg:w-[calc(33.333%-1.5rem)] max-w-md">
      {/* Plus icons positioned absolutely relative to the container */}
      <Icon
        name="plus"
        size={40}
        className="-top-3.5 -left-3.5 z-10 absolute opacity-30 text-gray-400 dark:text-white/40 pointer-events-none"
      />
      <Icon
        name="plus"
        size={40}
        className="-bottom-3.5 -left-3.5 z-10 absolute opacity-30 text-gray-400 dark:text-white/40 pointer-events-none"
      />
      <Icon
        name="plus"
        size={40}
        className="-top-3.5 -right-3.5 z-10 absolute opacity-30 text-gray-400 dark:text-white/40 pointer-events-none"
      />
      <Icon
        name="plus"
        size={40}
        className="-right-3.5 -bottom-3.5 z-10 absolute opacity-30 text-gray-400 dark:text-white/40 pointer-events-none"
      />

      {/* Main card content */}
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className="flex justify-center items-center bg-white dark:bg-card shadow-sm p-4 border border-gray-200 dark:border-border/40 rounded-3xl w-full h-full aspect-[3/4] overflow-hidden cursor-pointer"
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
              className="absolute inset-0 w-full h-full"
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="z-20 relative flex flex-col justify-center items-center w-full h-full">
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
            className="top-1/2 left-1/2 absolute -translate-x-1/2 -translate-y-1/2"
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
                <h2 className="font-bold text-white text-2xl md:text-3xl">{title}</h2>
                <p className="mt-4 max-w-prose text-white text-sm">{des}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
