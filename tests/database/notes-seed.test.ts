import { desc, eq } from "drizzle-orm";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { seedNotes, storylioNotes } from "../../scripts/seeds/notes";
import { runSeedPlan } from "../../scripts/seeds/run";
import type { Database } from "../../src/lib/db";
import * as schema from "../../src/lib/db/schema";
import { homePostWhere } from "../../src/lib/home-content";
import { createTestDatabase } from "../helpers/database";

let fixture: Awaited<ReturnType<typeof createTestDatabase>>;
beforeAll(async () => {
  fixture = await createTestDatabase();
});
beforeEach(async () => {
  await fixture.client.exec('TRUNCATE "User", "Tag", "HomeSection" CASCADE');
  await fixture.db.insert(schema.user).values({
    id: "notes-owner",
    email: "notes@example.test",
    bio: "Preserve my profile",
  });
});
afterAll(async () => {
  await fixture?.client.close();
  vi.unstubAllEnvs();
});
const seed = () =>
  seedNotes({ db: fixture.db as unknown as Database, ownerId: "notes-owner" });
const notesQuery = (kind: "writing" | "notes") =>
  fixture.db.query.post.findMany({
    where: (table) =>
      homePostWhere(
        table,
        kind,
        new Date(),
        fixture.db
          .select({ postId: schema.postToTag.postId })
          .from(schema.postToTag)
          .innerJoin(schema.tag, eq(schema.postToTag.tagId, schema.tag.id))
          .where(eq(schema.tag.name, "notes")),
      ),
    orderBy: (table) => [desc(table.publishedAt), desc(table.createdAt)],
    limit: 3,
  });

describe("Storylio work notes seed", () => {
  it("creates three published notes visible to Home, separate from writing", async () => {
    expect(await seed()).toEqual({ created: 3, skipped: 0 });
    expect((await notesQuery("notes")).map((note) => note.slug).sort()).toEqual(
      storylioNotes.map((note) => note.slug).sort(),
    );
    expect(await notesQuery("writing")).toEqual([]);
    expect(await fixture.db.query.tag.findMany()).toHaveLength(1);
    expect(await fixture.db.query.postToTag.findMany()).toHaveLength(3);
  });
  it("preserves edited content, drafts, tags, dates and views on repeat runs", async () => {
    await seed();
    const [first] = await fixture.db.query.post.findMany();
    await fixture.db
      .update(schema.post)
      .set({
        title: "Owner's edit",
        content: "Saved content",
        excerpt: "Saved excerpt",
        status: "DRAFT",
        publishedAt: null,
        viewCount: 42,
      })
      .where(eq(schema.post.id, first.id));
    await fixture.db
      .delete(schema.postToTag)
      .where(eq(schema.postToTag.postId, first.id));
    const before = await fixture.db.query.post.findMany({
      orderBy: (table) => [table.id],
    });
    expect(await seed()).toEqual({ created: 0, skipped: 3 });
    expect(
      await fixture.db.query.post.findMany({ orderBy: (table) => [table.id] }),
    ).toEqual(before);
    expect(await fixture.db.query.postToTag.findMany()).toHaveLength(2);
    expect(await notesQuery("notes")).toHaveLength(2);
  });
  it("rolls back the complete batch when an insert fails", async () => {
    await fixture.client.exec(
      `ALTER TABLE "Post" ADD CONSTRAINT reject_note CHECK (slug <> 'storylio-notes-a-button-that-stays-ready')`,
    );
    try {
      await expect(seed()).rejects.toThrow();
      expect(await fixture.db.query.post.findMany()).toEqual([]);
      expect(await fixture.db.query.tag.findMany()).toEqual([]);
    } finally {
      await fixture.client.exec(
        'ALTER TABLE "Post" DROP CONSTRAINT reject_note',
      );
    }
  });
  it("the notes-only menu plan does not seed demo writing or change the owner", async () => {
    vi.stubEnv("OWNER_EMAIL", "notes@example.test");
    await runSeedPlan(fixture.db as unknown as Database, {
      parts: ["notes"],
      updateProfile: false,
    });
    expect(await notesQuery("notes")).toHaveLength(3);
    expect(await fixture.db.query.project.findMany()).toEqual([]);
    expect(await fixture.db.query.homeSection.findMany()).toEqual([]);
    expect((await fixture.db.query.user.findFirst())?.bio).toBe(
      "Preserve my profile",
    );
  });
  it.each(["projects", "posts", "notes"] as const)(
    "rejects a missing owner before writing earlier groups for %s",
    async (part) => {
      vi.stubEnv("OWNER_EMAIL", "missing-owner@example.test");
      const before = await fixture.db.query.homeSection.findMany();
      await expect(
        runSeedPlan(fixture.db as unknown as Database, {
          parts: ["home", part],
          updateProfile: false,
        }),
      ).rejects.toThrow("Seed the owner account first");
      expect(await fixture.db.query.homeSection.findMany()).toEqual(before);
      expect(await fixture.db.query.post.findMany()).toEqual([]);
      expect(await fixture.db.query.project.findMany()).toEqual([]);
    },
  );
});
