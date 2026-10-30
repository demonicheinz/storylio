import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { FloatingNav } from "@/components/common/floating-nav";
import { getPublicNavIndex } from "@/lib/navigation";

const route = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));

const items = [
  { name: "Home", link: "/" },
  { name: "About", link: "/about" },
  { name: "Projects", link: "/projects" },
  { name: "Blog", link: "/blog" },
  { name: "Gallery", link: "/gallery" },
];
const hrefs = items.map((item) => item.link);

describe("public navigation routes", () => {
  it.each([
    ["/", 0],
    ["/about", 1],
    ["/about/", 1],
    ["/projects", 2],
    ["/projects/storylio", 2],
    ["/blog", 3],
    ["/blog/article", 3],
    ["/gallery", 4],
    ["/preview/projects/storylio", 2],
    ["/preview/posts/article", 3],
    ["/blogger", -1],
    ["/unknown", -1],
  ])("selects the appropriate section for %s", (pathname, index) => {
    expect(getPublicNavIndex(pathname, hrefs)).toBe(index);
  });

  it("renders GooeyNav with an active parent and accessible link names", () => {
    route.pathname = "/projects/storylio";
    const html = renderToStaticMarkup(
      createElement(FloatingNav, { navItems: items }),
    );
    const active = html.match(/<a\b[^>]*aria-current="page"[^>]*>/g) ?? [];
    expect(html).toContain('data-slot="gooey-nav"');
    expect(html).toContain('aria-label="Main navigation"');
    expect(active).toHaveLength(1);
    expect(active[0]).toContain('href="/projects"');
    for (const item of items)
      expect(html).toContain(`aria-label="${item.name}"`);
  });

  it("does not select Home for an unknown route", () => {
    route.pathname = "/unknown";
    const html = renderToStaticMarkup(
      createElement(FloatingNav, { navItems: items }),
    );
    expect(html).not.toContain('aria-current="page"');
  });
});
