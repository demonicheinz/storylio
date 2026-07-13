"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useActiveSection } from "@/hooks/use-active-section";
import { cn } from "@/lib/utils";

export type ContentTocItem = {
  id: string;
  title: string;
  level: 2 | 3;
};

type ContentTocProps = {
  items: ContentTocItem[];
  eyebrow: string;
  description?: string;
  ariaLabel: string;
  indicator?: "line" | "number";
};

export function ContentToc({
  items,
  eyebrow,
  description,
  ariaLabel,
  indicator = "line",
}: ContentTocProps) {
  const sectionIds = useMemo(() => items.map((item) => item.id), [items]);
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

  if (items.length === 0) return null;

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (!element) return;

    const targetId = `#${id}`;
    setDisplayActiveId(targetId);
    setLockedActiveId(targetId);

    if (lockTimeoutRef.current) {
      window.clearTimeout(lockTimeoutRef.current);
    }

    lockTimeoutRef.current = window.setTimeout(() => {
      setLockedActiveId("");
    }, 1200);

    const offsetPosition =
      element.getBoundingClientRect().top + window.scrollY - 96;

    window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    window.history.pushState(null, "", `#${id}`);
  };

  return (
    <aside className="hidden xl:block top-28 sticky self-start bg-surface/60 shadow-[0_0_48px_rgba(139,92,246,0.08)] backdrop-blur-xl p-5 border border-border/40 rounded-3xl max-h-[calc(100vh-8rem)] overflow-y-auto">
      <p className="font-semibold text-brand-soft text-xs uppercase tracking-[0.24em]">
        {eyebrow}
      </p>
      {description && (
        <p className="mt-2 text-muted-foreground text-sm leading-6">
          {description}
        </p>
      )}

      <nav aria-label={ariaLabel} className={description ? "mt-5" : "mt-4"}>
        <ol className="flex flex-col gap-3">
          {items.map((item, index) => {
            const isActive = displayActiveId === `#${item.id}`;

            return (
              <li key={item.id} className="group">
                <button
                  type="button"
                  aria-current={isActive ? "true" : undefined}
                  onClick={() => scrollTo(item.id)}
                  className={cn(
                    "flex items-start outline-none w-full hover:text-brand-soft focus-visible:text-brand-soft text-sm text-left leading-6 transition-colors cursor-pointer",
                    indicator === "line" ? "gap-2" : "gap-3",
                    item.level === 3 &&
                      (indicator === "line" ? "pl-4" : "pl-7"),
                    isActive
                      ? "font-medium text-brand-soft"
                      : item.level === 3
                        ? "text-muted-foreground"
                        : "text-foreground/80",
                  )}
                >
                  {indicator === "line" ? (
                    <span
                      className={cn(
                        "bg-muted-foreground mt-3 w-3 h-px transition-all shrink-0",
                        isActive && "w-5 bg-brand-soft",
                      )}
                    />
                  ) : (
                    item.level === 2 && (
                      <span
                        className={cn(
                          "mt-0.5 font-mono text-[0.65rem] text-muted-foreground group-focus-within:text-brand-soft group-hover:text-brand-soft tracking-wider transition-colors",
                          isActive && "text-brand-soft",
                        )}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    )
                  )}
                  <span>{item.title}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
    </aside>
  );
}
