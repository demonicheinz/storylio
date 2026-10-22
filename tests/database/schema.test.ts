import { eq, like } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  containsPattern,
  flattenPostTags,
  orderPostTagsByName,
} from "../../src/lib/db/query-utils";
import * as schema from "../../src/lib/db/schema";
import { createTestDatabase } from "../helpers/database";

let fixture: Awaited<ReturnType<typeof createTestDatabase>>;
beforeAll(async () => {
  fixture = await createTestDatabase();
});
afterAll(async () => {
  await fixture.client.close();
});

describe("Drizzle against the existing PostgreSQL schema", () => {
  it("supports the correlated tag-name ordering used by public content queries", async () => {
    const [owner] = await fixture.db
      .insert(schema.user)
      .values({ email: "tag-order@example.test" })
      .returning();
    const [post] = await fixture.db
      .insert(schema.post)
      .values({
        authorId: owner.id,
        title: "Ordered",
        slug: "ordered-tags",
        content: "Content",
      })
      .returning();
    const tags = await fixture.db
      .insert(schema.tag)
      .values([{ name: "Zebra" }, { name: "Alpha" }])
      .returning();
    await fixture.db
      .insert(schema.postToTag)
      .values(tags.map((tag) => ({ postId: post.id, tagId: tag.id })));
    try {
      const row = await fixture.db.query.post.findFirst({
        where: eq(schema.post.id, post.id),
        with: {
          tags: {
            columns: {},
            with: { tag: true },
            orderBy: orderPostTagsByName,
          },
        },
      });
      expect(row?.tags.map((link) => link.tag.name)).toEqual([
        "Alpha",
        "Zebra",
      ]);
      const projected = await fixture.db.query.post.findFirst({
        where: eq(schema.post.id, post.id),
        with: {
          tags: {
            columns: {},
            with: { tag: { columns: { name: true } } },
            orderBy: orderPostTagsByName,
          },
        },
      });
      if (!projected) throw new Error("Expected projected post");
      expect(flattenPostTags(projected)).toEqual({
        ...post,
        tags: [{ name: "Alpha" }, { name: "Zebra" }],
      });
    } finally {
      await fixture.db.delete(schema.user).where(eq(schema.user.id, owner.id));
      for (const tag of tags)
        await fixture.db.delete(schema.tag).where(eq(schema.tag.id, tag.id));
    }
  });
  it("generates IDs and timestamps without changing existing SQL defaults", async () => {
    const [owner] = await fixture.db
      .insert(schema.user)
      .values({ email: "owner@example.test" })
      .returning();
    expect(owner.id).toBeTruthy();
    expect(owner.createdAt).toBeInstanceOf(Date);
    expect(owner.updatedAt).toBeInstanceOf(Date);
    expect(owner.emailVerified).toBe(false);
    const before = new Date("2020-01-01T00:00:00Z");
    await fixture.db
      .update(schema.user)
      .set({ updatedAt: before })
      .where(eq(schema.user.id, owner.id));
    const [updated] = await fixture.db
      .update(schema.user)
      .set({ name: "Owner" })
      .where(eq(schema.user.id, owner.id))
      .returning();
    expect(updated.updatedAt.getTime()).toBeGreaterThan(before.getTime());
    expect(updated.createdAt).toEqual(owner.createdAt);
  });

  it("refreshes post updatedAt on edits and bulk status updates", async () => {
    const before = new Date("2020-01-01T00:00:00Z");
    const [owner] = await fixture.db
      .insert(schema.user)
      .values({ email: "timestamps@example.test" })
      .returning();
    const posts = await fixture.db
      .insert(schema.post)
      .values(
        ["timestamp-first", "timestamp-second"].map((slug) => ({
          authorId: owner.id,
          title: "Original",
          content: "Content",
          slug,
          updatedAt: before,
        })),
      )
      .returning();
    const [edited] = await fixture.db
      .update(schema.post)
      .set({ title: "Edited" })
      .where(eq(schema.post.id, posts[0].id))
      .returning();
    expect(edited.updatedAt.getTime()).toBeGreaterThan(before.getTime());
    expect(edited.createdAt).toEqual(posts[0].createdAt);

    for (const status of ["PUBLISHED", "DRAFT"] as const) {
      await fixture.db
        .update(schema.post)
        .set({ updatedAt: before })
        .where(eq(schema.post.authorId, owner.id));
      const updated = await fixture.db
        .update(schema.post)
        .set({ status })
        .where(eq(schema.post.authorId, owner.id))
        .returning();
      expect(updated).toHaveLength(2);
      for (const row of updated) {
        expect(row.status).toBe(status);
        expect(row.updatedAt.getTime()).toBeGreaterThan(before.getTime());
      }
    }
    await fixture.db.delete(schema.user).where(eq(schema.user.id, owner.id));
  });

  it("reads legacy CUIDs and resolves the existing Post/Tag junction", async () => {
    const [owner] = await fixture.db
      .insert(schema.user)
      .values({
        id: "cllegacyowner0000000000001",
        email: "legacy@example.test",
      })
      .returning();
    const [post] = await fixture.db
      .insert(schema.post)
      .values({
        id: "cllegacypost00000000000001",
        authorId: owner.id,
        title: "Legacy",
        slug: "legacy",
        content: "Content",
        status: "PUBLISHED",
      })
      .returning();
    const [tag] = await fixture.db
      .insert(schema.tag)
      .values({ name: "drizzle" })
      .returning();
    await fixture.db
      .insert(schema.postToTag)
      .values({ postId: post.id, tagId: tag.id });
    const row = await fixture.db.query.post.findFirst({
      where: eq(schema.post.id, post.id),
      with: { author: true, tags: { with: { tag: true } } },
    });
    expect(row).toBeDefined();
    if (!row) throw new Error("Expected the legacy post");
    const result = flattenPostTags(row);
    expect(result.id).toBe(post.id);
    expect(result.author.id).toBe(owner.id);
    expect(result.tags).toEqual([{ id: tag.id, name: "drizzle" }]);
  });

  it("keeps nullable PostgreSQL arrays and application defaults compatible", async () => {
    const [owner] = await fixture.db
      .insert(schema.user)
      .values({ email: "arrays@example.test" })
      .returning();
    const [defaulted] = await fixture.db
      .insert(schema.project)
      .values({ authorId: owner.id, title: "Default", slug: "default-array" })
      .returning();
    const [nullable] = await fixture.db
      .insert(schema.project)
      .values({
        authorId: owner.id,
        title: "Null",
        slug: "null-array",
        techStack: null,
      })
      .returning();
    expect(defaulted.techStack).toEqual([]);
    expect(nullable.techStack).toBeNull();
  });

  it("rolls back ordering shifts and inserted rows together", async () => {
    const [existing] = await fixture.db
      .insert(schema.galleryItem)
      .values({ imageUrl: "https://example.test/existing.webp", order: 0 })
      .returning();
    await expect(
      fixture.db.transaction(async (tx) => {
        await tx
          .update(schema.galleryItem)
          .set({ order: 1 })
          .where(eq(schema.galleryItem.id, existing.id));
        await tx
          .insert(schema.galleryItem)
          .values({ imageUrl: "https://example.test/rollback.webp", order: 0 });
        throw new Error("Simulated failure");
      }),
    ).rejects.toThrow("Simulated failure");
    const rows = await fixture.db.query.galleryItem.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0].order).toBe(0);
  });

  it("keeps literal substring checks safe for URL percent and underscore characters", async () => {
    const literal = "https://example.test/a_b%20c";
    await fixture.db.insert(schema.media).values([
      {
        url: literal,
        publicId: "literal",
        filename: "literal",
        format: "png",
        size: 1,
      },
      {
        url: "https://example.test/axbZZ20c",
        publicId: "other",
        filename: "other",
        format: "png",
        size: 1,
      },
    ]);
    const rows = await fixture.db
      .select()
      .from(schema.media)
      .where(like(schema.media.url, containsPattern(literal)));
    expect(rows).toHaveLength(1);
    expect(rows[0].url).toBe(literal);
  });

  it("preserves unique constraints and cascades through the existing junction", async () => {
    const owner = await fixture.db.query.user.findFirst({
      where: eq(schema.user.email, "legacy@example.test"),
    });
    if (!owner) throw new Error("Expected owner fixture");
    await expect(
      fixture.db.insert(schema.user).values({ email: owner.email }),
    ).rejects.toThrow();
    await fixture.db.delete(schema.user).where(eq(schema.user.id, owner.id));
    expect(
      await fixture.db.query.post.findFirst({
        where: eq(schema.post.slug, "legacy"),
      }),
    ).toBeUndefined();
    expect(await fixture.db.query.postToTag.findMany()).toEqual([]);
    expect(await fixture.db.query.tag.findMany()).toHaveLength(1);
  });
});
