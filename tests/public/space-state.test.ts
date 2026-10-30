import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ErrorState } from "@/components/common/error-state";
import { SpaceState } from "@/components/common/space-state";

vi.mock("@/hooks/use-report-error", () => ({ useReportError: vi.fn() }));

describe("recovery boundaries", () => {
  it("offers a real home route and decorative transparent assets on 404", () => {
    const html = renderToStaticMarkup(
      createElement(SpaceState, { branded: true }),
    );
    expect(html).toContain("Lost in orbit.");
    expect(html).toContain("404-astronaut.avif");
    expect(html).toContain("auth-earth.avif");
    expect(html).toContain('href="/"');
    expect(html).toContain('alt=""');
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).not.toContain("Try again");
  });
  it("adds a context-specific archive without exposing missing content", () => {
    const html = renderToStaticMarkup(
      createElement(SpaceState, {
        title: "This project isn’t available.",
        archive: { href: "/projects", label: "Back to projects" },
      }),
    );
    expect(html).toContain('href="/projects"');
    expect(html).not.toContain("Storylio home");
  });
  it("keeps unexpected-error recovery distinct from not-found navigation", () => {
    const html = renderToStaticMarkup(
      createElement(ErrorState, {
        error: new Error("private fixture details"),
        retry: () => {},
        boundary: "public",
      }),
    );
    expect(html).toContain("Try again");
    expect(html).toContain('href="/"');
    expect(html).not.toContain("private fixture details");
    expect(html).not.toContain("404-astronaut");
  });
});
