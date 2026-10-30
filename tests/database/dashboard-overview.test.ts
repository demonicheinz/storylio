import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import * as schema from "@/lib/db/schema";
import { createTestDatabase } from "../helpers/database";

let fixture: Awaited<ReturnType<typeof createTestDatabase>>;
let getOverview: typeof import("@/features/dashboard/overview/queries").getDashboardOverview;
beforeAll(async () => {
  fixture = await createTestDatabase();
  vi.doMock("@/lib/db", () => ({ db: fixture.db }));
  ({ getDashboardOverview: getOverview } = await import(
    "@/features/dashboard/overview/queries"
  ));
  await fixture.db
    .insert(schema.user)
    .values({ id: "owner", email: "owner@example.test" });
});
afterAll(async () => {
  vi.doUnmock("@/lib/db");
  await fixture.client.close();
});
describe("dashboard overview data", () => {
  it("returns honest zero counts for an empty collection", async () => {
    const data = await getOverview();
    expect(data.posts.total).toBe(0);
    expect(data.views).toBe(0);
    expect(data.writing).toEqual([]);
  });
  it("recognizes coverless notes, excludes scheduled publication, and counts only published featured work", async () => {
    const now = new Date();
    await fixture.db.insert(schema.post).values([
      {
        id: "note",
        authorId: "owner",
        title: "A note",
        slug: "a-note",
        content: "Note",
        status: "PUBLISHED",
        viewCount: 3,
        updatedAt: now,
      },
      {
        id: "article",
        authorId: "owner",
        title: "Article",
        slug: "article",
        content: "Article",
        status: "PUBLISHED",
        viewCount: 7,
        updatedAt: now,
      },
      {
        id: "scheduled",
        authorId: "owner",
        title: "Scheduled",
        slug: "scheduled",
        content: "Later",
        status: "PUBLISHED",
        publishedAt: new Date(Date.now() + 86_400_000),
        updatedAt: now,
      },
      {
        id: "draft",
        authorId: "owner",
        title: "Draft",
        slug: "draft",
        content: "Draft",
        status: "DRAFT",
        updatedAt: now,
      },
    ]);
    await fixture.db.insert(schema.tag).values({ id: "notes", name: "notes" });
    await fixture.db
      .insert(schema.postToTag)
      .values({ postId: "note", tagId: "notes" });
    await fixture.db.insert(schema.project).values([
      {
        authorId: "owner",
        title: "Live",
        slug: "live",
        status: "PUBLISHED",
        isFeatured: true,
        viewCount: 4,
      },
      {
        authorId: "owner",
        title: "Draft",
        slug: "draft",
        status: "DRAFT",
        isFeatured: true,
      },
    ]);
    await fixture.db.insert(schema.galleryItem).values([
      { imageUrl: "https://example.test/a.jpg", isVisible: true },
      { imageUrl: "https://example.test/b.jpg", isVisible: false },
    ]);
    const data = await getOverview();
    expect(data.posts).toMatchObject({ total: 4, published: 2, drafts: 1 });
    expect(data.projects).toMatchObject({
      featured: 1,
      published: 1,
      drafts: 1,
    });
    expect(data.gallery).toEqual({ total: 2, visible: 1, hidden: 1 });
    expect(data.views).toBe(14);
    expect(data.writing.find((item) => item.id === "note")).toMatchObject({
      kind: "Note",
      image: null,
      status: "Published",
      publicHref: "/blog?tag=notes&note=a-note",
    });
    expect(data.writing.find((item) => item.id === "scheduled")?.status).toBe(
      "Scheduled",
    );
    expect(data).not.toHaveProperty("healthItems");
  });
});
