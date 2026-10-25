import { isValidElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import HomeManagePage from "@/app/(dashboard)/dashboard/home/page";

const queries = vi.hoisted(() => ({
  sections: vi.fn(),
  testimonials: vi.fn(),
}));
vi.mock("next/server", () => ({ connection: () => new Promise(() => {}) }));
vi.mock("@/lib/db", () => ({
  db: {
    query: {
      homeSection: { findMany: queries.sections },
      testimonial: { findMany: queries.testimonials },
    },
  },
}));
vi.mock("@/features/dashboard/home/components/home-section-form", () => ({
  HomeContentManager: () => null,
}));

describe("dashboard Home streaming", () => {
  it("renders its heading and loading state before request-bound queries resolve", () => {
    const shell = HomeManagePage();
    expect(isValidElement(shell)).toBe(true);
    const html = renderToStaticMarkup(shell);
    expect(html).toContain(">Home</h1>");
    expect(html).toContain('aria-label="Loading Home content"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('data-slot="skeleton"');
    expect(queries.sections).not.toHaveBeenCalled();
    expect(queries.testimonials).not.toHaveBeenCalled();
  });
});
