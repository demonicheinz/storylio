import { asc, eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { seedAboutContent } from "../../scripts/seeds/about";
import { seedGallery } from "../../scripts/seeds/gallery";
import { seedHomeSections } from "../../scripts/seeds/home-sections";
import { seedOwner } from "../../scripts/seeds/owner";
import { seedPosts } from "../../scripts/seeds/posts";
import { seedProjects } from "../../scripts/seeds/projects";
import type { Database } from "../../src/lib/db";
import * as schema from "../../src/lib/db/schema";
import { createTestDatabase } from "../helpers/database";

let fixture: Awaited<ReturnType<typeof createTestDatabase>> | undefined;
let db: Awaited<ReturnType<typeof createTestDatabase>>["db"];
let seedDb: Database;

beforeEach(async () => {
  vi.stubEnv("OWNER_EMAIL", " Seed.Owner@example.test ,ignored@example.test");
  vi.stubEnv("OWNER_PASSWORD", "dummy-seed-password-for-tests-only");
  fixture = await createTestDatabase();
  db = fixture.db;
  // Both drivers execute the same PostgreSQL schema and transaction queries.
  seedDb = db as unknown as Database;
}, 30_000);

afterEach(async () => {
  try {
    await fixture?.client.close();
  } finally {
    fixture = undefined;
    vi.unstubAllEnvs();
  }
});

describe("PostgreSQL seed integration", () => {
  it("creates one owner and keeps the original ID and credential on repeated seeds", async () => {
    const first = await seedOwner(seedDb, {
      profile: {
        name: "Fixture Owner",
        tagline: "Web developer",
        subheadline: "An owner-supplied introduction.",
      },
    });
    const [credential] = await db.query.account.findMany();
    expect(credential).toMatchObject({
      userId: first.id,
      accountId: first.id,
      providerId: "credential",
    });
    expect(credential.password).toBeTruthy();
    expect(credential.password).not.toBe(process.env.OWNER_PASSWORD);

    vi.stubEnv("OWNER_PASSWORD", "a-different-dummy-password");
    const second = await seedOwner(seedDb);
    const third = await seedOwner(seedDb);

    expect(second.id).toBe(first.id);
    expect(third.id).toBe(first.id);
    expect(await db.query.account.findMany()).toEqual([credential]);
    expect(await db.query.user.findMany()).toEqual([
      expect.objectContaining({
        id: first.id,
        email: "seed.owner@example.test",
        name: "Fixture Owner",
        emailVerified: true,
        tagline: "Web developer",
        bio: "An owner-supplied introduction.",
      }),
    ]);
  });

  it("preserves an existing legacy owner, credential and passkey without recreating auth rows", async () => {
    const [owner] = await db
      .insert(schema.user)
      .values({
        id: "cllegacyseedowner000000001",
        email: "seed.owner@example.test",
        name: "Existing owner",
        emailVerified: false,
        image: "https://example.test/avatar.png",
      })
      .returning();
    const [credential] = await db
      .insert(schema.account)
      .values({
        id: "cllegacycredential0000001",
        userId: owner.id,
        accountId: "existing-account",
        providerId: "credential",
        password: "existing-dummy-hash-must-stay-unchanged",
      })
      .returning();
    const [passkey] = await db
      .insert(schema.passkey)
      .values({
        id: "existing-passkey",
        userId: owner.id,
        name: "Existing security key",
        credentialID: "dummy-credential-id",
        publicKey: "dummy-public-key",
        counter: 42,
        deviceType: "singleDevice",
        backedUp: false,
        transports: "usb",
        createdAt: new Date("2026-01-01T00:00:00Z"),
      })
      .returning();

    expect((await seedOwner(seedDb)).id).toBe(owner.id);
    expect((await seedOwner(seedDb)).id).toBe(owner.id);

    expect(await db.query.user.findMany()).toEqual([
      expect.objectContaining({
        id: owner.id,
        createdAt: owner.createdAt,
        image: owner.image,
        emailVerified: false,
        name: "Existing owner",
      }),
    ]);
    expect(await db.query.account.findMany()).toEqual([credential]);
    expect(await db.query.passkey.findMany()).toEqual([passkey]);
  });

  it("reuses posts and tags and replaces tag links without duplicates on repeated seeds", async () => {
    const [owner] = await db
      .insert(schema.user)
      .values({ email: "posts@example.test" })
      .returning();
    const [existingTag] = await db
      .insert(schema.tag)
      .values({
        id: "cllegacyuitag000000000001",
        name: "UI/UX",
      })
      .returning();
    await seedPosts({ db: seedDb, ownerId: owner.id });
    const originalPosts = await db.query.post.findMany({
      orderBy: [asc(schema.post.slug)],
    });
    const originalTags = await db.query.tag.findMany({
      orderBy: [asc(schema.tag.name)],
    });
    const originalLinks = await db.query.postToTag.findMany({
      orderBy: [asc(schema.postToTag.postId), asc(schema.postToTag.tagId)],
    });
    const [extraTag] = await db
      .insert(schema.tag)
      .values({ name: "Remove this link" })
      .returning();
    await db
      .insert(schema.postToTag)
      .values({ postId: originalPosts[0].id, tagId: extraTag.id });

    await seedPosts({ db: seedDb, ownerId: owner.id });
    await seedPosts({ db: seedDb, ownerId: owner.id });

    const posts = await db.query.post.findMany({
      orderBy: [asc(schema.post.slug)],
      with: { tags: { with: { tag: true } } },
    });
    expect(posts.map(({ id, slug }) => ({ id, slug }))).toEqual(
      originalPosts.map(({ id, slug }) => ({ id, slug })),
    );
    expect(
      posts.map((post) => [
        post.slug,
        post.tags.map(({ tag }) => tag.name).sort(),
      ]),
    ).toEqual([
      [
        "building-storylio-with-server-first-pages",
        ["Architecture", "Next.js", "Prisma"],
      ],
      [
        "designing-calm-interfaces-for-repeated-work",
        ["Dashboard", "Product", "UI/UX"],
      ],
      ["draft-note", ["Testing"]],
      [
        "what-i-look-for-in-a-portfolio-project",
        ["Portfolio", "UI/UX", "Writing"],
      ],
    ]);
    expect(
      await db.query.postToTag.findMany({
        orderBy: [asc(schema.postToTag.postId), asc(schema.postToTag.tagId)],
      }),
    ).toEqual(originalLinks);
    expect(originalLinks).toHaveLength(10);
    expect(
      await db.query.tag.findMany({ orderBy: [asc(schema.tag.name)] }),
    ).toEqual(
      [...originalTags, extraTag].sort((a, b) => a.name.localeCompare(b.name)),
    );
    expect(
      await db.query.tag.findFirst({ where: eq(schema.tag.name, "UI/UX") }),
    ).toEqual(existingTag);
  });

  it("matches legacy post upsert behavior by restoring sample content and view counts", async () => {
    const [owner] = await db
      .insert(schema.user)
      .values({ email: "post-reset@example.test" })
      .returning();
    await seedPosts({ db: seedDb, ownerId: owner.id });
    const original = await db.query.post.findFirst({
      where: eq(schema.post.slug, "building-storylio-with-server-first-pages"),
    });
    if (!original) throw new Error("Expected seeded post");
    const { createdAt, updatedAt: _updatedAt, ...originalFields } = original;
    await db
      .update(schema.post)
      .set({
        title: "Owner-edited title",
        content: "Owner-edited content",
        excerpt: "Owner-edited excerpt",
        status: "DRAFT",
        publishedAt: null,
        viewCount: 999,
      })
      .where(eq(schema.post.id, original.id));

    await seedPosts({ db: seedDb, ownerId: owner.id });

    const reseeded = await db.query.post.findFirst({
      where: eq(schema.post.id, original.id),
    });
    expect(reseeded).toMatchObject({ ...originalFields, createdAt });
  });

  it("keeps project IDs and screenshot rows stable and preserves edited screenshots", async () => {
    const [owner] = await db
      .insert(schema.user)
      .values({ email: "projects@example.test" })
      .returning();
    await seedProjects({ db: seedDb, ownerId: owner.id });
    const projects = await db.query.project.findMany({
      orderBy: [asc(schema.project.slug)],
    });
    const screenshots = await db.query.projectScreenshot.findMany({
      orderBy: [asc(schema.projectScreenshot.id)],
    });
    expect(projects).toHaveLength(5);
    expect(screenshots).toHaveLength(7);
    const edited = screenshots[0];
    await db
      .update(schema.projectScreenshot)
      .set({ caption: "Owner-edited caption" })
      .where(eq(schema.projectScreenshot.id, edited.id));
    const expectedScreenshots = await db.query.projectScreenshot.findMany({
      orderBy: [asc(schema.projectScreenshot.id)],
    });

    await seedProjects({ db: seedDb, ownerId: owner.id });
    await seedProjects({ db: seedDb, ownerId: owner.id });

    expect(
      (
        await db.query.project.findMany({ orderBy: [asc(schema.project.slug)] })
      ).map(({ id, slug, techStack }) => ({ id, slug, techStack })),
    ).toEqual(
      projects.map(({ id, slug, techStack }) => ({ id, slug, techStack })),
    );
    expect(
      await db.query.projectScreenshot.findMany({
        orderBy: [asc(schema.projectScreenshot.id)],
      }),
    ).toEqual(expectedScreenshots);
    const counts = await db.query.project.findMany({
      orderBy: [asc(schema.project.slug)],
      with: { structuredScreenshots: true },
    });
    expect(
      counts.map((project) => [
        project.slug,
        project.structuredScreenshots.length,
      ]),
    ).toEqual([
      ["archive-draft", 0],
      ["canvas-notes", 0],
      ["nebula-commerce", 2],
      ["pulse-analytics", 2],
      ["storylio", 3],
    ]);
  });

  it("does not duplicate initial About, gallery, home sections", async () => {
    async function seedInitialContent() {
      await seedAboutContent(seedDb);
      await seedGallery({ db: seedDb });
      await seedHomeSections(seedDb);
    }
    async function readInitialContent() {
      return {
        about: await db.query.aboutContent.findMany(),
        gallery: await db.query.galleryItem.findMany({
          orderBy: [asc(schema.galleryItem.order)],
        }),
        sections: await db.query.homeSection.findMany({
          orderBy: [
            asc(schema.homeSection.type),
            asc(schema.homeSection.order),
          ],
        }),
      };
    }
    await seedInitialContent();
    const original = await readInitialContent();
    expect(original.about).toHaveLength(1);
    expect(original.gallery).toHaveLength(8);
    expect(original.sections).toHaveLength(8);

    await seedInitialContent();
    expect(await readInitialContent()).toEqual(original);
  });
});
