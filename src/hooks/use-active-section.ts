"use client";

import { useEffect, useState } from "react";

type ActiveSectionMode = "intersection" | "position";

export function useActiveSection(
  sectionIds: string[],
  mode: ActiveSectionMode = "intersection",
) {
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    if (mode === "position") {
      let animationFrame = 0;

      const updateActiveSection = () => {
        const sections = sectionIds
          .map((id) => document.getElementById(id))
          .filter((section): section is HTMLElement => Boolean(section));

        if (sections.length === 0) {
          return;
        }

        const documentElement = document.documentElement;
        const scrollPosition = window.scrollY;
        const activationOffset = Math.min(140, window.innerHeight * 0.25);
        const isNearPageEnd =
          scrollPosition + window.innerHeight >=
          documentElement.scrollHeight - 24;

        if (isNearPageEnd) {
          setActiveId(`#${sections.at(-1)?.id}`);
          return;
        }

        const activationPosition = scrollPosition + activationOffset;
        let currentSection = sections[0];

        for (const section of sections) {
          const sectionTop =
            section.getBoundingClientRect().top + scrollPosition;

          if (sectionTop <= activationPosition) {
            currentSection = section;
          } else {
            break;
          }
        }

        setActiveId(`#${currentSection.id}`);
      };

      const onScroll = () => {
        cancelAnimationFrame(animationFrame);
        animationFrame = requestAnimationFrame(updateActiveSection);
      };

      updateActiveSection();
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);

      return () => {
        cancelAnimationFrame(animationFrame);
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(`#${entry.target.id}`);
          }
        }
      },
      {
        threshold: 0.2,
        rootMargin: "-20% 0px -75% 0px",
      },
    );

    for (const id of sectionIds) {
      const element = document.getElementById(id);

      if (element) {
        observer.observe(element);
      }
    }

    return () => {
      observer.disconnect();
    };
  }, [mode, sectionIds]);

  return activeId;
}
