"use client";

import type Lenis from "lenis";

// Assigned only by the mounted browser effect, never during server rendering.
let scroller: Lenis | null = null;
const locks = new Set<symbol>();

export function registerPageScroller(instance: Lenis) {
  scroller = instance;
  if (locks.size) instance.stop();
  return () => {
    if (scroller === instance) scroller = null;
  };
}

/** Keep overlapping overlays locked until the last one has finished exiting. */
export function lockPageScroll() {
  const token = Symbol();
  locks.add(token);
  scroller?.stop();
  return () => {
    if (locks.delete(token) && locks.size === 0) scroller?.start();
  };
}

export function navigateToAnchor(href: `#${string}`) {
  let id: string;
  try {
    id = decodeURIComponent(href.slice(1));
  } catch {
    return false;
  }
  const target = document.getElementById(id);
  if (!target || locks.size) return false;
  if (window.location.hash !== href) window.history.pushState(null, "", href);
  scrollPageTo(target);
  if (!target.hasAttribute("tabindex")) {
    target.setAttribute("tabindex", "-1");
    target.addEventListener("blur", () => target.removeAttribute("tabindex"), {
      once: true,
    });
  }
  target.focus({ preventScroll: true });
  return true;
}

export function scrollPageTo(
  target: HTMLElement | number,
  { immediate = false }: { immediate?: boolean } = {},
) {
  if (locks.size) return;
  // Reveal transforms move the painted heading, not its final layout position.
  // Use layout coordinates so an anchor also lands correctly during an entrance.
  let top = typeof target === "number" ? target : 0;
  if (typeof target !== "number") {
    let element: HTMLElement | null = target;
    while (element) {
      top += element.offsetTop;
      const parent = element.offsetParent as HTMLElement | null;
      if (parent) top += parent.clientTop;
      element = parent;
    }
    top -= Number.parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
    top -=
      Number.parseFloat(
        getComputedStyle(document.documentElement).scrollPaddingTop,
      ) || 0;
  }
  if (scroller) {
    scroller.scrollTo(top, { immediate });
  } else {
    window.scrollTo({ top, behavior: immediate ? "instant" : "auto" });
  }
}
