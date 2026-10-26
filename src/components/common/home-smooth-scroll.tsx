"use client";

import type Lenis from "lenis";
import { cancelFrame, frame } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { registerPageScroller } from "@/lib/page-scroll";

export function HomeSmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/") return;
    const preference = matchMedia(
      "(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)",
    );
    let disposed = false;
    let generation = 0;
    let focused = document.hasFocus();
    let instance: Lenis | null = null;
    let unregister = () => {};
    const update = ({ timestamp }: { timestamp: number }) => {
      instance?.raf(timestamp);
    };
    const syncActivity = () => {
      cancelFrame(update);
      if (!instance) return;
      // Discard pending inertia before suspending or resuming the shared clock.
      instance.scrollTo(instance.actualScroll, { immediate: true });
      if (focused && !document.hidden) frame.update(update, true);
    };
    const teardown = () => {
      generation++;
      cancelFrame(update);
      unregister();
      instance?.destroy();
      instance = null;
    };
    const syncPreference = async () => {
      teardown();
      if (!preference.matches) return;
      const ticket = generation;
      try {
        const { default: Lenis } = await import("lenis");
        if (disposed || ticket !== generation) return;
        instance = new Lenis({
          autoRaf: false,
          lerp: 0.14,
          smoothWheel: true,
          syncTouch: false,
          anchors: false,
          stopInertiaOnNavigate: true,
          prevent: (node) =>
            node.matches('[role="dialog"], [role="listbox"], textarea, select'),
        });
        unregister = registerPageScroller(instance);
        syncActivity();
      } catch {
        // Native scrolling remains available if the deferred chunk fails.
        teardown();
      }
    };
    const onBlur = () => {
      focused = false;
      syncActivity();
    };
    const onFocus = () => {
      focused = true;
      syncActivity();
    };
    preference.addEventListener("change", syncPreference);
    document.addEventListener("visibilitychange", syncActivity);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    void syncPreference();
    return () => {
      disposed = true;
      teardown();
      preference.removeEventListener("change", syncPreference);
      document.removeEventListener("visibilitychange", syncActivity);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
    };
  }, [pathname]);

  return null;
}
