"use client";

import { FunnelSimpleIcon } from "@phosphor-icons/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ProjectFiltersProps = {
  technologies: string[];
  selectedTech?: string;
};

export function ProjectFilters({
  technologies,
  selectedTech,
}: ProjectFiltersProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateFilter = (tech?: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (tech) {
      params.set("tech", tech);
    } else {
      params.delete("tech");
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
        <FunnelSimpleIcon className="text-brand-soft" size={16} />
        Filter by stack
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
          variant={!selectedTech ? "default" : "outline"}
          className="rounded-full shrink-0"
          onClick={() => updateFilter()}
        >
          All
        </Button>
        {technologies.map((tech) => {
          const isActive = selectedTech === tech;

          return (
            <Button
              key={tech}
              type="button"
              size="sm"
              variant={isActive ? "default" : "outline"}
              className="rounded-full shrink-0"
              onClick={() => updateFilter(tech)}
            >
              {tech}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
