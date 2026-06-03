"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { TocItem } from "@/components/public/sections/blog/types";
import { useActiveSection } from "@/hooks/use-active-section";
import { cn } from "@/lib/utils";

type ArticleTocProps = {
  items: TocItem[];
};

export function ArticleToc({ items }: ArticleTocProps) {
  const sectionIds = useMemo(() => items.map((item) => item.id), [items]);
  const activeId = useActiveSection(sectionIds);
  const [displayActiveId, setDisplayActiveId] = useState(activeId);

  const isClickScrolling = useRef(false);
  const clickScrollTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect(() => {
    if (activeId && !isClickScrolling.current) {
      setDisplayActiveId(activeId);
    }
  }, [activeId]);

  if (items.length === 0) return null;

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (!element) return;

    isClickScrolling.current = true;
    clearTimeout(clickScrollTimeout.current);

    setDisplayActiveId(`#${id}`);

    const offsetPosition =
      element.getBoundingClientRect().top + window.scrollY - 96;

    window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    window.history.pushState(null, "", `#${id}`);

    clickScrollTimeout.current = setTimeout(() => {
      isClickScrolling.current = false;
    }, 800);
  };

  return (
    <aside className="sticky top-28 hidden max-h-[calc(100vh-8rem)] self-start overflow-y-auto rounded-3xl border border-border/40 bg-surface/60 p-5 shadow-[0_0_48px_rgba(139,92,246,0.08)] backdrop-blur-xl xl:block">
      <p className="mb-4 text-xs font-semibold tracking-[0.24em] text-muted-foreground uppercase">
        On this page
      </p>
      <nav aria-label="Article table of contents">
        <ol className="flex flex-col gap-3">
          {items.map((item) => (
            <li key={item.id} className="group">
              <button
                type="button"
                aria-current={
                  displayActiveId === `#${item.id}` ? "true" : undefined
                }
                onClick={() => scrollTo(item.id)}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-2 text-left text-sm leading-6 transition-colors hover:text-brand-soft",
                  item.level === 3 && "pl-4",
                  displayActiveId === `#${item.id}`
                    ? "font-medium text-brand-soft"
                    : item.level === 3
                      ? "text-muted-foreground"
                      : "text-foreground/80",
                )}
              >
                <span
                  className={cn(
                    "h-px w-3 shrink-0 bg-muted-foreground transition-all group-hover:w-5 group-hover:bg-brand-soft",
                    displayActiveId === `#${item.id}` && "w-5 bg-brand-soft",
                  )}
                />
                <span>{item.title}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>
    </aside>
  );
}
