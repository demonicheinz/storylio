"use client";

import { type ReactNode, useEffect, useState } from "react";

/** One brief entrance; input, reduced motion and leaving the tab finish it. */
export function AuthEntrance({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  const [complete, setComplete] = useState(false);
  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const finish = () => setComplete(true);
    const onPreference = () => {
      if (preference.matches) finish();
    };
    const onVisibility = () => {
      if (document.hidden) finish();
    };
    const limit = setTimeout(finish, 900);
    onPreference();
    preference.addEventListener("change", onPreference);
    window.addEventListener("blur", finish);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearTimeout(limit);
      preference.removeEventListener("change", onPreference);
      window.removeEventListener("blur", finish);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <main
      className={className}
      data-auth-intro={complete ? "complete" : "entering"}
      onFocusCapture={() => setComplete(true)}
      onPointerDownCapture={() => setComplete(true)}
      onAnimationEnd={(event) => {
        if ((event.target as HTMLElement).hasAttribute("data-auth-earth"))
          setComplete(true);
      }}
    >
      {children}
    </main>
  );
}
