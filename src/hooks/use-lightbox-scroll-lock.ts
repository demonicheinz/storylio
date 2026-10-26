"use client";

import { useCallback, useEffect, useRef } from "react";
import { lockPageScroll } from "@/lib/page-scroll";

/** Match the lightbox transition lifetime, including its closing animation. */
export function useLightboxScrollLock() {
  const release = useRef<(() => void) | null>(null);
  const entering = useCallback(() => {
    release.current ??= lockPageScroll();
  }, []);
  const exited = useCallback(() => {
    release.current?.();
    release.current = null;
  }, []);
  useEffect(() => exited, [exited]);
  return { entering, exited };
}
