"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useOptimistic, useTransition } from "react";
import { MultiSelectContent } from "@/components/common/multi-select/content";
import {
  MultiSelect,
  useMultiSelectContext,
} from "@/components/common/multi-select/context";
import {
  MultiSelectEmpty,
  MultiSelectItem,
  MultiSelectList,
} from "@/components/common/multi-select/list";
import {
  MultiSelectSearch,
  MultiSelectSelections,
  MultiSelectTrigger,
} from "@/components/common/multi-select/trigger";
import {
  buildProjectFilterHref,
  normalizeProjectTechnologies,
} from "@/lib/project-filters";
import styles from "./projects.module.css";

type ProjectFiltersProps = {
  technologies: string[];
  selectedTechnologies: string[];
  resultCount: number;
  totalProjects: number;
};

export function ProjectFilters({
  technologies,
  selectedTechnologies,
  resultCount,
  totalProjects,
}: ProjectFiltersProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useOptimistic(selectedTechnologies);
  const search = searchParams.toString();

  const update = (next: string[]) => {
    const normalized = normalizeProjectTechnologies(next);
    startTransition(() => {
      setSelected(normalized);
      router.push(buildProjectFilterHref(pathname, search, normalized), {
        scroll: false,
      });
    });
  };

  return (
    <fieldset
      className={styles.filterBar}
      style={{ minWidth: 0 }}
      aria-label="Filter projects by stack"
    >
      <p
        className={styles.result}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        aria-busy={pending}
      >
        {pending
          ? "Updating…"
          : selected.length
            ? `${resultCount} of ${totalProjects} projects`
            : `${resultCount} ${resultCount === 1 ? "project" : "projects"}`}
      </p>
      <div className={styles.filterControl}>
        <MultiSelect value={selected} onValueChange={update}>
          <MultiSelectTrigger label="Filter stack" onClear={() => update([])} />
          <MultiSelectContent>
            <MultiSelectSearch />
            <MultiSelectSelections />
            <p className={styles.filterHelp}>
              Projects must use every selected technology.
            </p>
            <MultiSelectList ariaLabel="Technologies">
              {Array.from(new Set([...technologies, ...selected]))
                .sort((a, b) => a.localeCompare(b))
                .map((tech) => (
                  <StackOption
                    key={tech}
                    technology={tech}
                    pathname={pathname}
                    search={search}
                  />
                ))}
            </MultiSelectList>
            <MultiSelectEmpty>No technologies found.</MultiSelectEmpty>
          </MultiSelectContent>
        </MultiSelect>
      </div>
    </fieldset>
  );
}

function StackOption({
  technology,
  pathname,
  search,
}: {
  technology: string;
  pathname: string;
  search: string;
}) {
  const router = useRouter();
  const context = useMultiSelectContext("StackOption");
  const next = context.values.includes(technology)
    ? context.values.filter((value) => value !== technology)
    : [...context.values, technology];
  const href = buildProjectFilterHref(pathname, search, next);
  const intended = context.open && context.activeValue === technology;
  useEffect(() => {
    if (intended) router.prefetch(href);
  }, [href, intended, router]);
  return <MultiSelectItem value={technology}>{technology}</MultiSelectItem>;
}
