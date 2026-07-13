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
    <div className="bg-background/65 sm:bg-surface/55 backdrop-blur-xl -mx-4 sm:mx-0 px-4 sm:px-5 py-3.5 sm:border border-border/30 border-y sm:rounded-3xl">
      <div className="flex items-center gap-2 mb-2.5 font-semibold text-muted-foreground text-xs uppercase tracking-[0.24em]">
        <TagIcon className="text-brand-soft" size={16} />
        Filter by topic
      </div>

      <div
        className={cn(
          "[&::-webkit-scrollbar]:hidden flex gap-2 pb-1 overflow-x-auto scrollbar-none",
          isPending && "opacity-70",
        )}
      >
        <Button
          type="button"
          size="sm"
          variant={!selectedTag ? "default" : "outline"}
          className="rounded-full shrink-0"
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
              className="rounded-full shrink-0"
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
