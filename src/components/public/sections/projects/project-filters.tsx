"use client";

import { FunnelSimpleIcon } from "@phosphor-icons/react";
import { usePathname, useSearchParams } from "next/navigation";
import { FilterLink } from "@/components/public/filter-link";

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
    <div className="bg-background/65 sm:bg-surface/55 backdrop-blur-xl -mx-4 sm:mx-0 px-4 sm:px-5 py-3.5 sm:border border-border/30 border-y sm:rounded-3xl">
      <div className="flex items-center gap-2 mb-2.5 font-semibold text-muted-foreground text-xs uppercase tracking-[0.24em]">
        <FunnelSimpleIcon className="text-brand-soft" size={16} />
        Filter by stack
      </div>

      <div className="[&::-webkit-scrollbar]:hidden flex gap-2 pb-1 overflow-x-auto scrollbar-none">
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
      </div>
    </div>
  );
}
