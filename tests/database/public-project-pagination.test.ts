import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import * as schema from "@/lib/db/schema";
import { getPublicProjects } from "@/lib/public-projects";
import { createTestDatabase } from "../helpers/database";

const state = vi.hoisted(() => ({ db: undefined as unknown }));
vi.mock("@/lib/db", () => ({
  get db() {
    if (!state.db) throw new Error("Fixture not ready");
    return state.db;
  },
}));
vi.mock("next/cache", () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));
let fixture: Awaited<ReturnType<typeof createTestDatabase>>;

beforeAll(async () => {
  fixture = await createTestDatabase();
  state.db = fixture.db;
  await fixture.db
    .insert(schema.user)
    .values({ id: "page-author", email: "pages@example.test" });
  const createdAt = new Date("2026-01-01T00:00:00Z");
  await fixture.db.insert(schema.project).values(
    Array.from({ length: 14 }, (_, index) => ({
      id: `page-${String(index).padStart(2, "0")}`,
      slug: `page-${index}`,
      title: `Fixture ${index}`,
      authorId: "page-author",
      status: "PUBLISHED" as const,
      isFeatured: index === 13,
      order: 0,
      createdAt,
      techStack: index < 8 ? ["Next.js", "TypeScript"] : ["React"],
    })),
  );
  await fixture.db.insert(schema.project).values({
    id: "draft",
    slug: "draft",
    title: "Draft",
    authorId: "page-author",
    status: "DRAFT",
    techStack: ["Private tech"],
  });
});
afterAll(async () => {
  await fixture?.client.close();
});

describe("public project pagination against PostgreSQL", () => {
  it("loads six per page with stable non-overlapping ordering and featured first", async () => {
    const pages = await Promise.all(
      [1, 2, 3].map((page) => getPublicProjects([], page)),
    );
    expect(pages.map((page) => page.projects.length)).toEqual([6, 6, 2]);
    expect(pages[0].projects[0].id).toBe("page-13");
    const ids = pages.flatMap((page) =>
      page.projects.map((project) => project.id),
    );
    expect(new Set(ids).size).toBe(14);
    expect(ids).not.toContain("draft");
    expect(
      (await getPublicProjects([], 1)).projects.map((row) => row.id),
    ).toEqual(pages[0].projects.map((row) => row.id));
  });
  it("uses the same AND predicate for page rows and filtered total", async () => {
    const first = await getPublicProjects(["Next.js", "TypeScript"], 1);
    const second = await getPublicProjects(["Next.js", "TypeScript"], 2);
    expect(first.totalResults).toBe(8);
    expect(second.projects).toHaveLength(2);
    expect(second.pagination).toMatchObject({
      page: 2,
      pageCount: 2,
      start: 7,
      end: 8,
      total: 8,
    });
    expect(first.totalProjects).toBe(14);
    expect(first.technologies).toEqual(["Next.js", "React", "TypeScript"]);
  });
  it("clamps out-of-range pages and preserves empty results", async () => {
    expect((await getPublicProjects([], 999)).pagination).toMatchObject({
      page: 3,
      start: 13,
      end: 14,
    });
    const empty = await getPublicProjects(["Next.js", "React"], 4);
    expect(empty.projects).toEqual([]);
    expect(empty.totalResults).toBe(0);
    expect(empty.pagination).toMatchObject({
      page: 1,
      pageCount: 0,
      start: 0,
      end: 0,
    });
  });

  it("keeps unknown and unpublished technologies empty without querying counts", async () => {
    const count = vi.spyOn(fixture.db, "$count");
    try {
      for (const selected of [
        ["unknown"],
        ["React", "unknown"],
        ["Private tech"],
      ]) {
        const result = await getPublicProjects(
          selected,
          Number.MAX_SAFE_INTEGER,
        );
        expect(result.projects).toEqual([]);
        expect(result.totalResults).toBe(0);
        expect(result.totalProjects).toBe(14);
      }
      expect(count).not.toHaveBeenCalled();
    } finally {
      count.mockRestore();
    }
  });
});
