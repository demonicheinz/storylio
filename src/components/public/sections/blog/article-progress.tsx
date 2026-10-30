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
      className="top-0 z-60 fixed inset-x-0 bg-border/30 h-px"
    >
      <div className="bg-link h-full" style={{ width: `${progress}%` }} />
    </div>
  );
}
