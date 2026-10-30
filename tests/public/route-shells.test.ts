import { isValidElement } from "react";
import { describe, expect, it, vi } from "vitest";
import DashboardAboutPage from "@/app/(dashboard)/dashboard/about/page";
import DashboardAnalyticsPage from "@/app/(dashboard)/dashboard/analytics/page";
import DashboardGalleryPage from "@/app/(dashboard)/dashboard/gallery/page";
import EditPostPage from "@/app/(dashboard)/dashboard/posts/[id]/edit/page";
import DashboardPostsPage from "@/app/(dashboard)/dashboard/posts/page";
import EditProjectPage from "@/app/(dashboard)/dashboard/projects/[id]/edit/page";
import DashboardProjectsPage from "@/app/(dashboard)/dashboard/projects/page";
import DashboardSettingsPage from "@/app/(dashboard)/dashboard/settings/page";
import AboutPage from "@/app/(public)/about/page";
import ArticlePage from "@/app/(public)/blog/[slug]/page";
import BlogPage from "@/app/(public)/blog/page";
import GalleryPage from "@/app/(public)/gallery/page";
import ProjectPage from "@/app/(public)/projects/[slug]/page";
import ProjectsPage from "@/app/(public)/projects/page";
import ArticlePreviewPage from "@/app/preview/posts/[slug]/page";
import ProjectPreviewPage from "@/app/preview/projects/[slug]/page";
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

// Load the real route modules during collection, outside each test's timer.
// Cold UI dependency transforms are not part of the synchronous shell contract.
const routes = [
  ["Projects", ProjectsPage],
  ["Blog", BlogPage],
  ["Gallery", GalleryPage],
  ["About", AboutPage],
  ["Project detail", ProjectPage],
  ["Article detail", ArticlePage],
  ["Project preview", ProjectPreviewPage],
  ["Article preview", ArticlePreviewPage],
  ["Dashboard Projects", DashboardProjectsPage],
  ["Dashboard Posts", DashboardPostsPage],
  ["Dashboard Gallery", DashboardGalleryPage],
  ["Dashboard About", DashboardAboutPage],
  ["Dashboard Settings", DashboardSettingsPage],
  ["Dashboard Analytics", DashboardAnalyticsPage],
  ["Edit project", EditProjectPage],
  ["Edit post", EditPostPage],
] as const;

describe("partial-prefetch route shells", () => {
  it("enables Cache Components and Partial Prefetching together", () => {
    expect(nextConfig.cacheComponents).toBe(true);
    expect(nextConfig.partialPrefetching).toBe(true);
  });

  it.each(routes)(
    "%s returns a shell before URL or request data resolves",
    (_name, render) => {
      const pending = new Promise<never>(() => {});
      const shell = Reflect.apply(render, undefined, [
        { params: pending, searchParams: pending },
      ]);
      expect(isValidElement(shell)).toBe(true);
    },
  );
});
