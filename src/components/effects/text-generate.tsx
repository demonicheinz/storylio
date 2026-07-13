"use client";

import { motion, stagger, useAnimate } from "motion/react";
import { useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";

export const TextGenerateEffect = ({
  as,
  words,
  highlightWords = [],
  highlightClass = "text-brand-soft",
  className,
  staggerDuration = 0.2,
  animationDuration = 2,
}: {
  as?: "div" | "h1";
  words: string;
  highlightWords?: string[];
  highlightClass?: string;
  className?: string;
  staggerDuration?: number;
  animationDuration?: number;
}) => {
  const [scope, animate] = useAnimate();

  // Memindahkan pemrosesan string ke useMemo untuk menghindari pemrosesan ulang
  const wordsArray = useMemo(() => words.split(" "), [words]);

  // Set untuk pencarian yang lebih cepat
  const highlightWordsSet = useMemo(
    () => new Set(highlightWords),
    [highlightWords],
  );

  useEffect(() => {
    // Hanya jalankan animasi jika scope.current tersedia
    if (scope.current) {
      animate(
        "span",
        { opacity: 1 },
        { duration: animationDuration, delay: stagger(staggerDuration) },
      );
    }
    // Dependency array yang lebih lengkap
  }, [scope, animate, staggerDuration, animationDuration]);

  const content = (
    <span className="block text-white leading-tight tracking-wide">
      <motion.span
        ref={scope}
        className="flex flex-wrap justify-center gap-y-0"
      >
        {wordsArray.map((word, idx) => (
          <motion.span
            // biome-ignore lint/suspicious/noArrayIndexKey: .
            key={`${word}-${idx}`}
            className={cn(
              highlightWordsSet.has(word) ? highlightClass : "text-white",
              "opacity-0",
            )}
          >
            {word}&nbsp;
          </motion.span>
        ))}
      </motion.span>
    </span>
  );

  if (as === "h1") {
    return <h1 className={cn("my-4 font-bold", className)}>{content}</h1>;
  }

  return <div className={cn("my-4 font-bold", className)}>{content}</div>;
};
