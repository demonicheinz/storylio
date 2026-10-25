import { isValidElement } from "react";
import { describe, expect, it, vi } from "vitest";
import nextConfig from "../../next.config";

vi.mock("@/lib/db", () => ({
  db: {
    query: new Proxy(
      {},
      {
        get: () => ({
          findMany: async () => [],
          findFirst: async () => null,
        }),
      },
    ),
  },
}));
vi.mock("@/lib/auth-session", () => ({ getActionSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: { api: {} } }));
vi.mock("next/server", () => ({ connection: () => new Promise(() => {}) }));
vi.mock("next/cache", () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
  updateTag: vi.fn(),
  revalidatePath: vi.fn(),
}));
vi.mock("@/lib/mdx", () => ({
  renderMDX: async () => null,
  renderPublicMDX: async () => null,
}));

const routes = [
  ["Projects", () => import("@/app/(public)/projects/page")],
  ["Blog", () => import("@/app/(public)/blog/page")],
  ["Gallery", () => import("@/app/(public)/gallery/page")],
  ["About", () => import("@/app/(public)/about/page")],
  ["Project detail", () => import("@/app/(public)/projects/[slug]/page")],
  ["Article detail", () => import("@/app/(public)/blog/[slug]/page")],
  ["Project preview", () => import("@/app/preview/projects/[slug]/page")],
  ["Article preview", () => import("@/app/preview/posts/[slug]/page")],
  [
    "Dashboard Projects",
    () => import("@/app/(dashboard)/dashboard/projects/page"),
  ],
  ["Dashboard Posts", () => import("@/app/(dashboard)/dashboard/posts/page")],
  [
    "Dashboard Gallery",
    () => import("@/app/(dashboard)/dashboard/gallery/page"),
  ],
  ["Dashboard About", () => import("@/app/(dashboard)/dashboard/about/page")],
  [
    "Dashboard Settings",
    () => import("@/app/(dashboard)/dashboard/settings/page"),
  ],
  [
    "Dashboard Analytics",
    () => import("@/app/(dashboard)/dashboard/analytics/page"),
  ],
  [
    "Edit project",
    () => import("@/app/(dashboard)/dashboard/projects/[id]/edit/page"),
  ],
  [
    "Edit post",
    () => import("@/app/(dashboard)/dashboard/posts/[id]/edit/page"),
  ],
] as const;

describe("partial-prefetch route shells", () => {
  it("enables Cache Components and Partial Prefetching together", () => {
    expect(nextConfig.cacheComponents).toBe(true);
    expect(nextConfig.partialPrefetching).toBe(true);
  });

  it.each(
    routes,
  )("%s returns a shell before URL or request data resolves", async (_name, load) => {
    const route = await load();
    const pending = new Promise<never>(() => {});
    const shell = Reflect.apply(route.default, undefined, [
      { params: pending, searchParams: pending },
    ]);
    expect(isValidElement(shell)).toBe(true);
  });
});
