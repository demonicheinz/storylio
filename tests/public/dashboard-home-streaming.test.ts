import { isValidElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import HomeManagePage from "@/app/(dashboard)/dashboard/home/page";

const queries = vi.hoisted(() => ({
  sections: vi.fn(),
  profile: vi.fn(),
  connection: vi.fn(() => new Promise<void>(() => {})),
  session: vi.fn(),
}));
vi.mock("next/server", () => ({ connection: queries.connection }));
vi.mock("@/lib/auth-session", () => ({ getActionSession: queries.session }));
vi.mock("@/lib/db", () => ({
  db: {
    query: {
      homeSection: { findMany: queries.sections },
      user: { findFirst: queries.profile },
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
    expect(queries.profile).not.toHaveBeenCalled();
  });
  it("passes the owner bio preview and editable collections without a testimonial query", async () => {
    queries.connection.mockResolvedValueOnce(undefined);
    queries.session.mockResolvedValueOnce({ user: { id: "owner" } });
    queries.profile.mockResolvedValueOnce({ bio: "Owner bio preview" });
    const createdAt = new Date("2026-01-01");
    queries.sections.mockResolvedValueOnce([
      { id: "home-hero", type: "HERO", label: "Headline", createdAt },
      { id: "phase", type: "PHASE", label: "Build", createdAt },
      { id: "logo", type: "LOGO", label: "Logo", createdAt },
    ]);
    const shell = HomeManagePage();
    const boundary = shell.props.children[1];
    const manager = await boundary.props.children.type();
    expect(manager.props).toMatchObject({
      headline: "Headline",
      subheadline: "Owner bio preview",
      phases: [
        { id: "phase", type: "PHASE", createdAt: createdAt.toISOString() },
      ],
      logos: [{ id: "logo", type: "LOGO", createdAt: createdAt.toISOString() }],
    });
    expect(manager.props).not.toHaveProperty("testimonials");
    expect(queries.profile).toHaveBeenCalledWith(
      expect.objectContaining({ columns: { bio: true } }),
    );
  });
});
