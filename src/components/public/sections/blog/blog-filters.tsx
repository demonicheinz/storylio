"use client";

import { TagIcon } from "@phosphor-icons/react";
import { usePathname, useSearchParams } from "next/navigation";
import { FilterLink } from "@/components/public/filter-link";

type BlogFiltersProps = {
  tags: string[];
  selectedTag?: string;
};

export function BlogFilters({ tags, selectedTag }: BlogFiltersProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const getFilterHref = (tag?: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (tag) {
      params.set("tag", tag);
    } else {
      params.delete("tag");
    }

    const query = params.toString();

    return query ? `${pathname}?${query}` : pathname;
  };

  return (
    <div className="bg-background/65 sm:bg-surface/55 backdrop-blur-xl -mx-4 sm:mx-0 px-4 sm:px-5 py-3.5 sm:border border-border/30 border-y sm:rounded-3xl">
      <div className="flex items-center gap-2 mb-2.5 font-semibold text-muted-foreground text-xs uppercase tracking-[0.24em]">
        <TagIcon className="text-brand-soft" size={16} />
        Filter by topic
      </div>

      <div className="[&::-webkit-scrollbar]:hidden flex gap-2 pb-1 overflow-x-auto scrollbar-none">
        <FilterLink href={getFilterHref()} active={!selectedTag}>
          All
        </FilterLink>
        {tags.map((tag) => {
          const isActive = selectedTag === tag;

          return (
            <FilterLink key={tag} href={getFilterHref(tag)} active={isActive}>
              {tag}
            </FilterLink>
          );
        })}
      </div>
    </div>
  );
}
