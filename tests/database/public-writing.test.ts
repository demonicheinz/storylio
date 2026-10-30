import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import * as schema from "@/lib/db/schema";
import { getPublicNote } from "@/lib/public-notes";
import { getPublicWriting } from "@/lib/public-writing";
import { createTestDatabase } from "../helpers/database";

const state = vi.hoisted(() => ({ db: undefined as unknown }));
vi.mock("@/lib/db", () => ({
  get db() {
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
    .values({ id: "writing-author", email: "writing@example.test" });
  await fixture.db.insert(schema.tag).values([
    { id: "react", name: "React" },
    { id: "notes", name: "notes" },
    { id: "journal", name: "journal" },
  ]);
  const createdAt = new Date("2026-01-01T00:00:00Z");
  await fixture.db.insert(schema.post).values(
    Array.from({ length: 24 }, (_, i) => ({
      id: `writing-${String(i).padStart(2, "0")}`,
      slug: `writing-${i}`,
      title: `Writing ${i}`,
      content: "Published fixture text",
      authorId: "writing-author",
      createdAt,
      status: i === 22 ? ("DRAFT" as const) : ("PUBLISHED" as const),
      publishedAt: i === 23 ? new Date("2999-01-01T00:00:00Z") : createdAt,
    })),
  );
  await fixture.db.insert(schema.postToTag).values([
    ...Array.from({ length: 7 }, (_, i) => ({
      postId: `writing-${String(i * 2).padStart(2, "0")}`,
      tagId: "react",
    })),
    ...Array.from({ length: 8 }, (_, i) => ({
      postId: `writing-${14 + i}`,
      tagId: "notes",
    })),
    { postId: "writing-14", tagId: "journal" },
    { postId: "writing-23", tagId: "notes" },
    { postId: "writing-22", tagId: "notes" },
  ]);
});
afterAll(async () => {
  await fixture?.client.close();
});

describe("public writing archive", () => {
  it("resolves a published off-page note but never articles, drafts or scheduled notes", async () => {
    const note = await getPublicNote("writing-21");
    expect(note?.id).toBe("writing-21");
    const read = vi.spyOn(fixture.db.query.post, "findFirst");
    try {
      for (const slug of [
        "writing-0",
        "writing-22",
        "writing-23",
        "unknown-note",
      ])
        expect(await getPublicNote(slug)).toBeNull();
      expect(read).not.toHaveBeenCalled();
    } finally {
      read.mockRestore();
    }
  });
  it("separates notes before paging and excludes draft/future posts", async () => {
    const pages = await Promise.all(
      [1, 2, 3].map((page) => getPublicWriting(undefined, page)),
    );
    expect(pages.map((page) => page.posts.length)).toEqual([6, 6, 2]);
    expect(pages[0].totalResults).toBe(14);
    expect(pages[0].tags).toEqual(["React"]);
    expect(
      new Set(pages.flatMap((page) => page.posts.map((post) => post.id))).size,
    ).toBe(14);
    expect(
      pages
        .flatMap((page) => page.posts)
        .every((post) => !post.tags.some((tag) => tag.name === "notes")),
    ).toBe(true);
  });
  it("filters a single topic and clamps the page before row reads", async () => {
    const result = await getPublicWriting(" React ", Number.MAX_SAFE_INTEGER);
    expect(result.totalResults).toBe(7);
    expect(result.posts).toHaveLength(1);
    expect(result.pagination.page).toBe(2);
    expect(result.posts[0].tags.some((tag) => tag.name === "React")).toBe(true);
  });
  it("provides the existing Notes URL with a separate total and stable pages", async () => {
    const result = await getPublicWriting("notes", 2);
    expect(result.kind).toBe("notes");
    expect(result.totalResults).toBe(8);
    expect(result.posts).toHaveLength(2);
    expect(
      result.posts.every((post) =>
        post.tags.some((tag) => tag.name === "notes"),
      ),
    ).toBe(true);
  });
  it("short-circuits unknown or note-only topics before the keyed row query", async () => {
    const read = vi.spyOn(fixture.db.query.post, "findMany");
    try {
      for (const tag of ["arbitrary", "journal"]) {
        read.mockClear();
        const result = await getPublicWriting(tag, 999);
        expect(result.posts).toEqual([]);
        expect(result.pagination.page).toBe(1);
        expect(read).toHaveBeenCalledTimes(1);
      }
    } finally {
      read.mockRestore();
    }
  });
});
