"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import React, { memo } from "react";

type SpotlightProps = {
  gradientFirst?: string;
  gradientSecond?: string;
  gradientThird?: string;
  translateY?: number;
  width?: number;
  height?: number;
  smallWidth?: number;
  duration?: number;
  xOffset?: number;
  className?: string;
};

const SpotlightGradient = memo(
  ({
    transform,
    background,
    width,
    height,
    className,
  }: {
    transform: string;
    background: string;
    width: number | string;
    height: number | string;
    className?: string;
  }) => (
    <div
      style={{
        transform,
        background,
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
      }}
      className={cn("absolute", className)}
    />
  ),
);

SpotlightGradient.displayName = "SpotlightGradient";

export const Spotlight = memo(
  ({
    gradientFirst = "radial-gradient(68.54% 68.72% at 55.02% 31.46%, hsla(210, 100%, 85%, .08) 0, hsla(210, 100%, 55%, .02) 50%, hsla(210, 100%, 45%, 0) 80%)",
    gradientSecond = "radial-gradient(50% 50% at 50% 50%, hsla(210, 100%, 85%, .06) 0, hsla(210, 100%, 55%, .02) 80%, transparent 100%)",
    gradientThird = "radial-gradient(50% 50% at 50% 50%, hsla(210, 100%, 85%, .04) 0, hsla(210, 100%, 45%, .02) 80%, transparent 100%)",
    translateY = -350,
    width = 560,
    height = 1380,
    smallWidth = 240,
    duration = 7,
    xOffset = 100,
    className,
  }: SpotlightProps = {}) => {
    // Optimasi animasi dengan memindahkan definisi ke luar komponen
    const animationTransition = {
      duration,
      repeat: Infinity,
      repeatType: "reverse" as const,
      ease: "easeInOut",
    };

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
        className={cn("absolute inset-0 w-full h-full pointer-events-none", className)}
      >
        {/* Left side animation */}
        <motion.div
          animate={{ x: [0, xOffset, 0] }}
          transition={animationTransition}
          className="top-0 left-0 z-40 absolute w-screen h-screen pointer-events-none"
        >
          <SpotlightGradient
            transform={`translateY(${translateY}px) rotate(-45deg)`}
            background={gradientFirst}
            width={width}
            height={height}
            className="top-0 left-0"
          />
          <SpotlightGradient
            transform="rotate(-45deg) translate(5%, -50%)"
            background={gradientSecond}
            width={smallWidth}
            height={height}
            className="top-0 left-0 origin-top-left"
          />
          <SpotlightGradient
            transform="rotate(-45deg) translate(-180%, -70%)"
            background={gradientThird}
            width={smallWidth}
            height={height}
            className="top-0 left-0 origin-top-left"
          />
        </motion.div>

        {/* Right side animation */}
        <motion.div
          animate={{ x: [0, -xOffset, 0] }}
          transition={animationTransition}
          className="top-0 right-0 z-40 absolute w-screen h-screen pointer-events-none"
        >
          <SpotlightGradient
            transform={`translateY(${translateY}px) rotate(45deg)`}
            background={gradientFirst}
            width={width}
            height={height}
            className="top-0 right-0"
          />
          <SpotlightGradient
            transform="rotate(45deg) translate(-5%, -50%)"
            background={gradientSecond}
            width={smallWidth}
            height={height}
            className="top-0 right-0 origin-top-right"
          />
          <SpotlightGradient
            transform="rotate(45deg) translate(180%, -70%)"
            background={gradientThird}
            width={smallWidth}
            height={height}
            className="top-0 right-0 origin-top-right"
          />
        </motion.div>
      </motion.div>
    );
  },
);

Spotlight.displayName = "Spotlight";
