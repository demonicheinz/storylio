"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

/** CSS starts at first paint; interactions and reduced motion finish it immediately. */
export function HeroEntrance({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  const rootRef = useRef<HTMLElement>(null);
  const [complete, setComplete] = useState(false);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const finish = () => setComplete(true);
    const onPreference = () => {
      if (preference.matches) finish();
    };
    const onScroll = () => {
      if (scrollY > root.offsetTop + 120) finish();
    };
    const onVisibility = () => {
      if (document.hidden) finish();
    };
    const limit = setTimeout(finish, 1800);
    onPreference();
    onScroll();
    preference.addEventListener("change", onPreference);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("blur", finish);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearTimeout(limit);
      preference.removeEventListener("change", onPreference);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("blur", finish);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);
  return (
    <section
      ref={rootRef}
      className={className}
      data-home-hero
      data-intro-complete={complete}
      aria-labelledby="home-title"
      onFocusCapture={() => setComplete(true)}
      onClickCapture={() => setComplete(true)}
    >
      {children}
    </section>
  );
}
