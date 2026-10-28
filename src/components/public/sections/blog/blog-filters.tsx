"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import { MultiSelectContent } from "@/components/common/multi-select/content";
import { MultiSelect } from "@/components/common/multi-select/context";
import {
  MultiSelectEmpty,
  MultiSelectItem,
  MultiSelectList,
} from "@/components/common/multi-select/list";
import {
  MultiSelectSearch,
  MultiSelectTrigger,
} from "@/components/common/multi-select/trigger";
import { FilterLink } from "@/components/public/filter-link";
import { buildWritingFilterHref } from "@/lib/writing-filters";
import styles from "./blog.module.css";
export function BlogFilters({
  tags,
  selectedTag,
  resultCount,
  totalPosts,
}: {
  tags: string[];
  selectedTag?: string;
  resultCount: number;
  totalPosts: number;
}) {
  const pathname = usePathname(),
    search = useSearchParams().toString(),
    router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useOptimistic(selectedTag ?? "");
  const notes = selectedTag === "notes";
  const href = (tag?: string) => buildWritingFilterHref(pathname, search, tag);
  const update = (next: string[]) =>
    startTransition(() => {
      const tag = next[0] ?? "";
      setSelected(tag);
      router.push(href(tag || undefined), { scroll: false });
    });
  return (
    <div className={styles.toolbar}>
      <nav className={styles.formats} aria-label="Writing formats">
        <FilterLink href={href()} active={!notes}>
          Articles
        </FilterLink>
        <FilterLink href={href("notes")} active={notes}>
          Notes
        </FilterLink>
      </nav>
      <p
        className={styles.result}
        role="status"
        aria-live="polite"
        aria-busy={pending}
      >
        {pending
          ? "Updating…"
          : `${resultCount}${selectedTag && !notes ? ` of ${totalPosts}` : ""} ${notes ? "notes" : resultCount === 1 ? "article" : "articles"}`}
      </p>
      {!notes && (
        <div className={styles.topic}>
          <MultiSelect
            selectionMode="single"
            value={selected ? [selected] : []}
            onValueChange={update}
          >
            <MultiSelectTrigger
              label="Filter topic"
              fieldLabel="Topic"
              emptyLabel="All topics"
              clearLabel="Reset topic"
              onClear={() => update([])}
            />
            <MultiSelectContent>
              <MultiSelectSearch
                label="Search topics"
                placeholder="Search topics…"
              />
              <MultiSelectList ariaLabel="Topics">
                {[...new Set([...tags, ...(selected ? [selected] : [])])]
                  .sort((a, b) => a.localeCompare(b))
                  .map((tag) => (
                    <MultiSelectItem key={tag} value={tag}>
                      {tag}
                    </MultiSelectItem>
                  ))}
              </MultiSelectList>
              <MultiSelectEmpty>No topics found.</MultiSelectEmpty>
            </MultiSelectContent>
          </MultiSelect>
        </div>
      )}
    </div>
  );
}
