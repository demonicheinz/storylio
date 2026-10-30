"use client";

import { useEffect } from "react";

/** Protect draft editors: protect reloads and ordinary in-app link navigation. */
export function useUnsavedChangesGuard(dirty: boolean, context: string) {
  useEffect(() => {
    if (!dirty) return;
    const unload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const navigate = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const anchor =
        event.target instanceof Element
          ? event.target.closest("a[href]")
          : null;
      if (
        !(anchor instanceof HTMLAnchorElement) ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download")
      )
        return;
      const next = new URL(anchor.href, location.href);
      if (
        !["http:", "https:"].includes(next.protocol) ||
        (next.origin === location.origin &&
          next.pathname === location.pathname &&
          next.search === location.search)
      )
        return;
      if (!window.confirm(`Leave ${context} and discard unsaved changes?`)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", navigate, true);
    return () => {
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("click", navigate, true);
    };
  }, [dirty, context]);
}
