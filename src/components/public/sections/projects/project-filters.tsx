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
    <div className="sticky top-20 z-20 -mx-4 border-y border-border/30 bg-background/80 px-4 py-3.5 backdrop-blur-xl sm:mx-0 sm:rounded-3xl sm:border sm:bg-surface/55 sm:px-5">
      <div className="mb-2.5 flex items-center gap-2 text-xs font-semibold tracking-[0.24em] text-muted-foreground uppercase">
        <FunnelSimpleIcon className="text-brand-soft" size={16} />
        Filter by stack
      </div>

      <div
        className={cn(
          "flex scrollbar-none gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden",
          isPending && "opacity-70",
        )}
      >
        <Button
          type="button"
          size="sm"
          variant={!selectedTech ? "default" : "outline"}
          className="shrink-0 rounded-full"
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
              className="shrink-0 rounded-full"
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
