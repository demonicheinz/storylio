"use client";

import { useEffect, useState } from "react";

export function ArticleProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;

    const updateProgress = () => {
      const documentElement = document.documentElement;
      const scrollableHeight =
        documentElement.scrollHeight - documentElement.clientHeight;
      const nextProgress =
        scrollableHeight > 0
          ? Math.min(window.scrollY / scrollableHeight, 1) * 100
          : 0;

      setProgress(nextProgress);
      frame = 0;
    };

    const onScroll = () => {
      if (frame === 0) {
        frame = window.requestAnimationFrame(updateProgress);
      }
    };

    updateProgress();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      if (frame !== 0) {
        window.cancelAnimationFrame(frame);
      }

      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-x-0 top-0 z-60 h-px bg-border/30"
    >
      <div
        className="h-full bg-linear-to-r from-brand-soft via-violet-300 to-sky-300 shadow-[0_0_18px_rgba(139,92,246,0.65)]"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
