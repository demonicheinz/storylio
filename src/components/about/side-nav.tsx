import { sideNavItems } from "@/data";
import { useActiveSection } from "@/hooks";
import { cn } from "@/lib/utils";

export function SideNavigation() {
  const sectionIds = sideNavItems.map((item) => item.id);
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
          <li
            key={item.id}
            className="group"
          >
            <button
              type="button"
              onClick={() => scrollTo(item.id, item.href)}
              className={cn(
                "flex items-center gap-2 transition-colors hover:text-foreground cursor-pointer",
                activeId === item.id ? "text-foreground font-medium" : "text-muted-foreground",
              )}
            >
              <div
                className={cn(
                  "h-[1px] w-4 transition-all group-hover:w-6 group-hover:bg-foreground",
                  activeId === item.id ? "bg-primary w-6" : "bg-muted-foreground",
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
