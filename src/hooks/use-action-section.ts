"use client";

import { useEffect, useState } from "react";

/**
 * Hook that tracks which section is currently active in the viewport
 * Used for highlighting active navigation links, table of contents, etc.
 *
 * @param sectionIds - Array of section IDs to observe
 * @param options - IntersectionObserver options (optional)
 * @returns The ID of the currently active section (with # prefix)
 */
export function useActiveSection(sectionIds: string[], options = {}) {
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveId(`#${entry.target.id}`);
        }
      });
    };

    // Default observer options prioritize sections near the top of the viewport
    const observerOptions = {
      threshold: 0.2,
      rootMargin: "-20% 0px -75% 0px",
      ...options,
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observe each section element
    sectionIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    observers.push(observer);

    // Clean up observers on unmount
    return () => {
      observers.forEach((obs) => obs.disconnect());
    };
  }, [sectionIds, options]);

  return activeId;
}
