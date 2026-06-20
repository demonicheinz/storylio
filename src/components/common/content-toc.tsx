"use client";

import { useEffect, useMemo, useState } from "react";
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
  const activeId = useActiveSection(sectionIds);
  const [displayActiveId, setDisplayActiveId] = useState(activeId);

  useEffect(() => {
    if (activeId) {
      setDisplayActiveId(activeId);
    }
  }, [activeId]);

  if (items.length === 0) return null;

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (!element) return;

    setDisplayActiveId(`#${id}`);

    const offsetPosition =
      element.getBoundingClientRect().top + window.scrollY - 96;

    window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    window.history.pushState(null, "", `#${id}`);
  };

  return (
    <aside className="sticky top-28 hidden max-h-[calc(100vh-8rem)] self-start overflow-y-auto rounded-3xl border border-border/40 bg-surface/60 p-5 shadow-[0_0_48px_rgba(139,92,246,0.08)] backdrop-blur-xl xl:block">
      <p className="text-xs font-semibold tracking-[0.24em] text-brand-soft uppercase">
        {eyebrow}
      </p>
      {description && (
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
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
                    "flex w-full cursor-pointer items-start text-left text-sm leading-6 transition-colors outline-none hover:text-brand-soft focus-visible:text-brand-soft",
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
                        "mt-3 h-px w-3 shrink-0 bg-muted-foreground transition-all",
                        isActive && "w-5 bg-brand-soft",
                      )}
                    />
                  ) : (
                    item.level === 2 && (
                      <span
                        className={cn(
                          "mt-0.5 font-mono text-[0.65rem] tracking-wider text-muted-foreground transition-colors group-focus-within:text-brand-soft group-hover:text-brand-soft",
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
