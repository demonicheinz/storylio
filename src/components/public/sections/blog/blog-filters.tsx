"use client";

import { TagIcon } from "@phosphor-icons/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BlogFiltersProps = {
  tags: string[];
  selectedTag?: string;
};

export function BlogFilters({ tags, selectedTag }: BlogFiltersProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateFilter = (tag?: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (tag) {
      params.set("tag", tag);
    } else {
      params.delete("tag");
    }

    const query = params.toString();

    startTransition(() => {
      router.push(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    });
  };

  return (
    <div className="sticky top-20 z-20 -mx-4 border-y border-border/30 bg-background/80 px-4 py-4 backdrop-blur-xl sm:mx-0 sm:rounded-3xl sm:border sm:bg-surface/55">
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-[0.24em] text-muted-foreground uppercase">
        <TagIcon className="text-brand-soft" size={16} />
        Filter by topic
      </div>

      <div
        className={cn(
          "flex gap-2 overflow-x-auto pb-1",
          isPending && "opacity-70",
        )}
      >
        <Button
          type="button"
          size="sm"
          variant={!selectedTag ? "default" : "outline"}
          className="shrink-0 rounded-full"
          onClick={() => updateFilter()}
        >
          All
        </Button>
        {tags.map((tag) => {
          const isActive = selectedTag === tag;

          return (
            <Button
              key={tag}
              type="button"
              size="sm"
              variant={isActive ? "default" : "outline"}
              className={cn(
                "shrink-0 rounded-full border-border/60 bg-surface/70",
                isActive &&
                  "border-brand-soft/60 bg-brand-soft text-primary-foreground shadow-[0_0_32px_rgba(139,92,246,0.18)]",
              )}
              onClick={() => updateFilter(tag)}
            >
              {tag}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
