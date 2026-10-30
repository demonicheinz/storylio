import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import Dashboard from "@/app/(dashboard)/dashboard/page";

const query = vi.hoisted(() => vi.fn());
vi.mock("next/server", () => ({ connection: () => new Promise(() => {}) }));
vi.mock("@/features/dashboard/overview/queries", () => ({
  getDashboardOverview: query,
}));
describe("dashboard overview streaming shell", () => {
  it("exposes creation actions and complete loading groups without waiting for SQL", () => {
    const html = renderToStaticMarkup(Dashboard());
    expect(html).toContain(">Overview</h1>");
    expect(html).toContain('aria-label="Loading dashboard overview"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain(">New</span>");
    expect(html).toContain('aria-haspopup="menu"');
    expect(html).toContain(">Writing</h2>");
    expect(html).toContain(">Projects</h2>");
    expect(query).not.toHaveBeenCalled();
  });
});
