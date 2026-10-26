"use client";

import type Lenis from "lenis";

// Assigned only by the mounted browser effect, never during server rendering.
let scroller: Lenis | null = null;

export function registerPageScroller(instance: Lenis) {
  scroller = instance;
  return () => {
    if (scroller === instance) scroller = null;
  };
}

export function scrollPageTo(
  target: HTMLElement | number,
  { immediate = false }: { immediate?: boolean } = {},
) {
  if (scroller) {
    scroller.scrollTo(target, { immediate });
  } else if (typeof target === "number") {
    window.scrollTo({ top: target, behavior: immediate ? "instant" : "auto" });
  } else {
    target.scrollIntoView({
      block: "start",
      behavior: immediate ? "instant" : "auto",
    });
  }
}
