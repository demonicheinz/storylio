import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import PublicRouteLoading from "../../src/app/(public)/loading";

const route = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));

describe("public route loading layout", () => {
  it.each([
    ["/projects/storylio", "project-detail"],
    ["/blog/building-storylio", "post-detail"],
    ["/projects", "collection"],
    ["/blog", "collection"],
    ["/about", "about"],
    ["/gallery", "gallery"],
  ])("uses the detail skeleton for %s", (pathname, variant) => {
    route.pathname = pathname;
    const markup = renderToStaticMarkup(createElement(PublicRouteLoading));
    expect(markup).toContain(`data-loading-variant="${variant}"`);
    expect(markup).toContain('aria-label="Loading page"');
    expect(markup).toContain('aria-busy="true"');
  });
});
