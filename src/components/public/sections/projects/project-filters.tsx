"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { FilterLink } from "@/components/public/filter-link";
import styles from "@/components/public/public-page.module.css";

type ProjectFiltersProps = {
  technologies: string[];
  selectedTech?: string;
};

export function ProjectFilters({
  technologies,
  selectedTech,
}: ProjectFiltersProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const getFilterHref = (tech?: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (tech) {
      params.set("tech", tech);
    } else {
      params.delete("tech");
    }

    const query = params.toString();

    return query ? `${pathname}?${query}` : pathname;
  };

  return (
    <nav className={styles.filters} aria-label="Filter projects by stack">
      <FilterLink href={getFilterHref()} active={!selectedTech}>
        All
      </FilterLink>
      {technologies.map((tech) => {
        const isActive = selectedTech === tech;

        return (
          <FilterLink key={tech} href={getFilterHref(tech)} active={isActive}>
            {tech}
          </FilterLink>
        );
      })}
    </nav>
  );
}
