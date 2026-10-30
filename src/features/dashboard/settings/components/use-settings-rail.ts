"use client";

import { useEffect, useRef, useState } from "react";

/** Use a rail only when the settings area itself has room beside the dashboard sidebar. */
export function useSettingsRail() {
  const frame = useRef<HTMLDivElement>(null);
  const [rail, setRail] = useState(false);
  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    const update = (width: number) => setRail(width >= 880);
    update(element.getBoundingClientRect().width);
    const observer = new ResizeObserver(([entry]) => {
      if (entry) update(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return { frame, rail };
}
