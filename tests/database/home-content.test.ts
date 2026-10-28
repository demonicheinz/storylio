import { desc, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as schema from "../../src/lib/db/schema";
import { homePostWhere } from "../../src/lib/home-content";
import { selectHomeTechnologies } from "../../src/lib/home-technologies";
import { createTestDatabase } from "../helpers/database";

let fixture: Awaited<ReturnType<typeof createTestDatabase>>;
const now = new Date("2026-10-25T00:00:00Z");
beforeAll(async () => {
  fixture = await createTestDatabase();
  await fixture.db
    .insert(schema.user)
    .values({ id: "home-owner", email: "home@example.test" });
  await fixture.db.insert(schema.tag).values([
    { id: "notes", name: "notes" },
    { id: "web", name: "Web" },
  ]);
  const posts = [
    ...Array.from({ length: 5 }, (_, i) => ({
      id: `note-${i}`,
      status: "PUBLISHED" as const,
      publishedAt: new Date(`2026-10-${20 + i}T00:00:00Z`),
    })),
    ...Array.from({ length: 4 }, (_, i) => ({
      id: `writing-${i}`,
      status: "PUBLISHED" as const,
      publishedAt: new Date(`2026-09-${10 + i}T00:00:00Z`),
    })),
    { id: "draft-note", status: "DRAFT" as const, publishedAt: null },
    {
      id: "future-note",
      status: "PUBLISHED" as const,
      publishedAt: new Date("2099-01-01"),
    },
    { id: "undated-note", status: "PUBLISHED" as const, publishedAt: null },
  ];
  await fixture.db.insert(schema.post).values(
    posts.map((p) => ({
      ...p,
      slug: p.id,
      title: p.id,
      content: "Fixture",
      authorId: "home-owner",
    })),
  );
  await fixture.db
    .insert(schema.postToTag)
    .values([
      ...posts
        .filter((p) => p.id.includes("note"))
        .map((p) => ({ postId: p.id, tagId: "notes" })),
      { postId: "note-4", tagId: "web" },
      { postId: "writing-3", tagId: "web" },
    ]);
});
afterAll(async () => {
  await fixture?.client.close();
});

describe("Home content categories", () => {
  const query = (kind: "notes" | "writing") =>
    fixture.db.query.post.findMany({
      where: (table) =>
        homePostWhere(
          table,
          kind,
          now,
          fixture.db
            .select({ postId: schema.postToTag.postId })
            .from(schema.postToTag)
            .innerJoin(schema.tag, eq(schema.postToTag.tagId, schema.tag.id))
            .where(eq(schema.tag.name, "notes")),
        ),
      columns: { id: true },
      orderBy: (table) => [desc(table.publishedAt), desc(table.createdAt)],
      limit: 3,
    });
  it("fills writing even when newer notes outnumber the Home limit", async () => {
    expect((await query("writing")).map((p) => p.id)).toEqual([
      "writing-3",
      "writing-2",
      "writing-1",
    ]);
  });
  it("keeps categories disjoint and excludes drafts and scheduled notes", async () => {
    const [notes, writing] = await Promise.all([
      query("notes"),
      query("writing"),
    ]);
    expect(notes.map((p) => p.id)).toEqual([
      "undated-note",
      "note-4",
      "note-3",
    ]);
    expect(notes.some((p) => writing.some((w) => w.id === p.id))).toBe(false);
    expect(
      notes.some((p) => ["draft-note", "future-note"].includes(p.id)),
    ).toBe(false);
  });
});
describe("Home technology curation", () => {
  it("keeps technology names, order and custom metadata, excluding companies and duplicates", () => {
    const logos = [
      { label: "Next.js", imageUrl: "custom.svg" },
      { label: "Acme Corp" },
      { label: "React" },
      { label: "nextjs" },
      { label: "Google" },
    ];
    expect(selectHomeTechnologies(logos)).toEqual([logos[0], logos[2]]);
  });
});
