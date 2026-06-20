"use client";

import { useEffect, useRef, useState } from "react";
import { useActiveSection } from "@/hooks/use-active-section";
import { cn } from "@/lib/utils";

export interface SideNavItem {
  title: {
    en: string;
    id: string;
  };
  href: string;
  id: string;
}

export const sideNavItems: SideNavItem[] = [
  {
    title: { en: "Introduction", id: "Perkenalan" },
    href: "#introduction",
    id: "introduction",
  },
  {
    title: { en: "Working Principles", id: "Prinsip Kerja" },
    href: "#working-principles",
    id: "working-principles",
  },
  {
    title: { en: "Work Experience", id: "Pengalaman Kerja" },
    href: "#work-experience",
    id: "work-experience",
  },
  {
    title: { en: "Education History", id: "Riwayat Pendidikan" },
    href: "#education-history",
    id: "education-history",
  },
  {
    title: { en: "Technical Skills", id: "Keahlian Teknis" },
    href: "#technical-skills",
    id: "technical-skills",
  },
];

const sectionIds = sideNavItems.map((item) => item.id);

export function AboutSideNavigation({ language }: { language: "en" | "id" }) {
  const activeId = useActiveSection(sectionIds, "position");
  const [displayActiveId, setDisplayActiveId] = useState(activeId);
  const [lockedActiveId, setLockedActiveId] = useState("");
  const lockTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (lockedActiveId) {
      if (activeId === lockedActiveId) {
        setDisplayActiveId(activeId);
        setLockedActiveId("");
      }

      return;
    }

    if (activeId) {
      setDisplayActiveId(activeId);
    }
  }, [activeId, lockedActiveId]);

  useEffect(() => {
    return () => {
      if (lockTimeoutRef.current) {
        window.clearTimeout(lockTimeoutRef.current);
      }
    };
  }, []);

  const scrollTo = (id: string, href: string) => {
    const element = document.getElementById(id);
    if (element) {
      setDisplayActiveId(href);
      setLockedActiveId(href);

      if (lockTimeoutRef.current) {
        window.clearTimeout(lockTimeoutRef.current);
      }

      lockTimeoutRef.current = window.setTimeout(() => {
        setLockedActiveId("");
      }, 1200);

      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - 80;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });

      // Update URL
      window.history.pushState(null, "", href);
    }
  };

  return (
    <nav
      className="py-2"
      style={{
        position: "fixed",
        left: 0,
        top: "50%",
        transform: "translateY(-50%)",
        whiteSpace: "nowrap",
        paddingLeft: "1.5rem",
      }}
    >
      <ul className="space-y-8">
        {sideNavItems.map((item) => (
          <li key={item.id} className="group">
            <button
              type="button"
              aria-current={displayActiveId === item.href ? "true" : undefined}
              onClick={() => scrollTo(item.id, item.href)}
              className={cn(
                "flex cursor-pointer items-center gap-2 transition-colors outline-none hover:text-brand-soft focus-visible:text-brand-soft",
                displayActiveId === item.href
                  ? "font-medium text-brand-soft"
                  : "text-muted-foreground",
              )}
            >
              <div
                className={cn(
                  "h-px w-4 bg-muted-foreground transition-all",
                  displayActiveId === item.href
                    ? "w-6 bg-brand-soft"
                    : "bg-muted-foreground",
                )}
              />
              <span>{item.title[language]}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
