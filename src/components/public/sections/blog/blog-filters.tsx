"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { FilterLink } from "@/components/public/filter-link";
import styles from "@/components/public/public-page.module.css";

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
    <nav className={styles.filters} aria-label="Filter writing by topic">
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
    </nav>
  );
}
