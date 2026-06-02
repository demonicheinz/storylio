"use client";

import { useActiveSection } from "@/hooks/use-active-section";
import { cn } from "@/lib/utils";

export interface SideNavItem {
  title: string;
  href: string;
  id: string;
}

export const sideNavItems: SideNavItem[] = [
  { title: "Introduction", href: "#introduction", id: "introduction" },
  { title: "Work Experience", href: "#work-experience", id: "work-experience" },
  {
    title: "Education History",
    href: "#education-history",
    id: "education-history",
  },
  {
    title: "Technical Skills",
    href: "#technical-skills",
    id: "technical-skills",
  },
];

const sectionIds = sideNavItems.map((item) => item.id);

export function SideNavigation() {
  const activeId = useActiveSection(sectionIds);

  const scrollTo = (id: string, href: string) => {
    const element = document.getElementById(id);
    if (element) {
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - 80;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });

      // Update URL
      window.history.pushState(null, "", href);
    }
  };

  return (
    <nav
      className="py-2"
      style={{
        position: "fixed",
        left: 0,
        top: "50%",
        transform: "translateY(-50%)",
        whiteSpace: "nowrap",
        paddingLeft: "1.5rem",
      }}
    >
      <ul className="space-y-8">
        {sideNavItems.map((item) => (
          <li key={item.id} className="group">
            <button
              type="button"
              aria-current={activeId === item.href ? "true" : undefined}
              onClick={() => scrollTo(item.id, item.href)}
              className={cn(
                "flex cursor-pointer items-center gap-2 transition-colors hover:text-foreground",
                activeId === item.href
                  ? "font-medium text-foreground"
                  : "text-muted-foreground",
              )}
            >
              <div
                className={cn(
                  "h-[1px] w-4 transition-all group-hover:w-6 group-hover:bg-foreground",
                  activeId === item.href
                    ? "w-6 bg-primary"
                    : "bg-muted-foreground",
                )}
              />
              <span>{item.title}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
