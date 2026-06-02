"use client";

import { motion, stagger, useAnimate } from "motion/react";
import { useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";

export const TextGenerateEffect = ({
  words,
  highlightWords = [],
  highlightClass = "text-brand-soft",
  className,
  staggerDuration = 0.2,
  animationDuration = 2,
}: {
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

  return (
    <div className={cn("font-bold", className)}>
      <div className="my-4">
        <div className="leading-tight tracking-wide text-white">
          <motion.div
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
          </motion.div>
        </div>
      </div>
    </div>
  );
};
