"use client";

import { type CSSProperties, useEffect, useRef } from "react";
import styles from "./blur-text.module.css";

/** Word-based blur from the supplied BlurText, keeping native text flow and SSR. */
export function BlurText({ text }: { text: string }) {
  const rootRef = useRef<HTMLSpanElement>(null);
  // biome-ignore lint/correctness/useExhaustiveDependencies: New text replaces the animated word tree and requires a fresh completion observer.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let disposed = false;
    const finish = () => {
      root.dataset.blurComplete = "true";
      delete root.dataset.blurPlaying;
    };
    const animations = root.getAnimations({ subtree: true });
    if (
      motion.matches ||
      animations.every((animation) => animation.playState === "finished")
    )
      finish();
    else {
      root.dataset.blurPlaying = "true";
      void Promise.allSettled(
        animations.map((animation) => animation.finished),
      ).then(() => {
        if (!disposed) finish();
      });
    }
    motion.addEventListener("change", finish);
    window.addEventListener("blur", finish);
    const onVisibility = () => {
      if (document.hidden) finish();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      disposed = true;
      finish();
      motion.removeEventListener("change", finish);
      window.removeEventListener("blur", finish);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [text]);
  const wordCount = text.trim().split(/\s+/).length;
  let wordIndex = 0;
  return (
    <span key={text} ref={rootRef} data-blur-text>
      {text.split(/(\s+)/).map((part, index) =>
        /^\s*$/.test(part) ? (
          part
        ) : (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: Word positions are fixed within the parent keyed by full text, including repeated words.
            key={index}
            className={styles.word}
            data-blur-word
            style={
              {
                "--blur-delay": `${0.35 + wordIndex++ * Math.min(0.08, 0.4 / Math.max(1, wordCount - 1))}s`,
              } as CSSProperties
            }
          >
            {part}
          </span>
        ),
      )}
    </span>
  );
}
