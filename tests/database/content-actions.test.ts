import { asc, eq } from "drizzle-orm";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  actionCreateGalleryItem,
  actionReorderGalleryItems,
  actionUpdateGalleryItem,
} from "../../src/features/dashboard/gallery/actions";
import {
  actionCreatePost,
  actionUpdatePost,
} from "../../src/features/dashboard/posts/actions";
import {
  actionCreateProject,
  actionUpdateProject,
} from "../../src/features/dashboard/projects/actions";
import type { ActionResult } from "../../src/lib/action-result";
import * as schema from "../../src/lib/db/schema";
import { createTestDatabase } from "../helpers/database";

type Fixture = Awaited<ReturnType<typeof createTestDatabase>>;
const effects = vi.hoisted(() => ({
  db: undefined as Fixture["db"] | undefined,
  session: vi.fn(),
  revalidatePath: vi.fn(),
}));

// Replace only the production connection. All queries and transactions use
// the real Drizzle/PGlite implementation over the archived PostgreSQL DDL.
vi.mock("@/lib/db", () => ({
  get db() {
    if (!effects.db) throw new Error("Test database is not initialized");
    return effects.db;
  },
}));
vi.mock("@/lib/auth-session", () => ({
  getActionSession: effects.session,
}));
vi.mock("next/cache", () => ({ revalidatePath: effects.revalidatePath }));

let fixture: Fixture;

function actionData<T>(result: ActionResult<T>): T {
  expect(result.success, JSON.stringify(result)).toBe(true);
  if (!result.success || !result.data)
    throw new Error("Action did not return data");
  return result.data;
}

const postInput = {
  title: "Post",
  slug: "post",
  status: "draft" as const,
  content: "Safe markdown content.",
  tags: [" TypeScript ", "typescript", "Drizzle"],
};
const projectInput = {
  title: "Project",
  slug: "project",
  status: "draft" as const,
  content: "Safe project markdown.",
  techStack: ["TypeScript"],
  structuredScreenshots: [
    {
      imageUrl: "https://example.test/old.webp",
      caption: "Original",
      order: 0,
    },
  ],
};
const galleryInput = {
  imageUrl: "https://example.test/image.webp",
  category: "Photography",
};

beforeAll(async () => {
  fixture = await createTestDatabase();
  effects.db = fixture.db;
});

beforeEach(async () => {
  vi.clearAllMocks();
  await fixture.client.exec('TRUNCATE "User", "Tag", "GalleryItem" CASCADE');
  const [owner] = await fixture.db
    .insert(schema.user)
    .values({ email: "actions@example.test" })
    .returning();
  effects.session.mockResolvedValue({ user: { id: owner.id } });
});

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(async () => {
  await fixture?.client.close();
});

async function galleryOrders() {
  return fixture.db.query.galleryItem.findMany({
    columns: { id: true, order: true },
    orderBy: asc(schema.galleryItem.order),
  });
}

async function seedGallery() {
  return fixture.db
    .insert(schema.galleryItem)
    .values(
      [0, 1, 2, 3].map((order) => ({
        imageUrl: `https://example.test/${order}.webp`,
        category: "Photography",
        order,
      })),
    )
    .returning();
}

describe("content actions against legacy PostgreSQL tables", () => {
  it("normalizes tags, reuses existing tags, and replaces links idempotently", async () => {
    const first = actionData(await actionCreatePost(postInput));
    const second = actionData(
      await actionCreatePost({
        ...postInput,
        slug: "second",
        tags: ["drizzle"],
      }),
    );
    const initialTags = await fixture.db.query.tag.findMany({
      orderBy: asc(schema.tag.name),
    });
    expect(initialTags.map((tag) => tag.name)).toEqual([
      "drizzle",
      "typescript",
    ]);
    const drizzleId = initialTags[0].id;

    for (let attempt = 0; attempt < 2; attempt++) {
      actionData(
        await actionUpdatePost(first.id, {
          ...postInput,
          tags: [" DRIZZLE ", "postgres", "Postgres"],
        }),
      );
    }
    const saved = await fixture.db.query.post.findFirst({
      where: eq(schema.post.id, first.id),
      with: { tags: { with: { tag: true } } },
    });
    expect(saved?.tags.map((link) => link.tag.name).sort()).toEqual([
      "drizzle",
      "postgres",
    ]);
    expect(saved?.tags.find((link) => link.tag.name === "drizzle")?.tagId).toBe(
      drizzleId,
    );
    expect(await fixture.db.query.tag.findMany()).toHaveLength(3);
    expect(await fixture.db.query.postToTag.findMany()).toHaveLength(3);

    actionData(await actionUpdatePost(first.id, { ...postInput, tags: [] }));
    expect(await fixture.db.query.postToTag.findMany()).toEqual([
      { postId: second.id, tagId: drizzleId },
    ]);
    expect(await fixture.db.query.tag.findMany()).toHaveLength(3);
    expect(effects.revalidatePath).toHaveBeenCalledWith("/blog/post");
  });

  it("replaces project screenshots and preserves their explicit ordering", async () => {
    const created = actionData(await actionCreateProject(projectInput));
    const old = await fixture.db.query.projectScreenshot.findFirst();
    actionData(
      await actionUpdateProject(created.id, {
        ...projectInput,
        techStack: [],
        structuredScreenshots: [
          {
            imageUrl: "https://example.test/later.webp",
            caption: "Later",
            order: 9,
          },
          {
            imageUrl: "https://example.test/first.webp",
            altText: "First",
            order: 2,
          },
        ],
      }),
    );
    const saved = await fixture.db.query.project.findFirst({
      where: eq(schema.project.id, created.id),
      with: {
        structuredScreenshots: { orderBy: asc(schema.projectScreenshot.order) },
      },
    });
    expect(saved?.techStack).toEqual([]);
    expect(
      saved?.structuredScreenshots.map((row) => [row.imageUrl, row.order]),
    ).toEqual([
      ["https://example.test/first.webp", 2],
      ["https://example.test/later.webp", 9],
    ]);
    expect(
      saved?.structuredScreenshots.every((row) => row.id !== old?.id),
    ).toBe(true);

    actionData(
      await actionUpdateProject(created.id, {
        ...projectInput,
        structuredScreenshots: [],
      }),
    );
    expect(await fixture.db.query.projectScreenshot.findMany()).toEqual([]);
  });

  it("rolls back screenshot replacement and neighboring order shifts if the final project update fails", async () => {
    const created = actionData(await actionCreateProject(projectInput));
    actionData(
      await actionCreateProject({
        ...projectInput,
        slug: "neighbor",
        structuredScreenshots: [],
      }),
    );
    const beforeProjects = await fixture.db.query.project.findMany({
      orderBy: asc(schema.project.id),
    });
    const beforeScreenshots =
      await fixture.db.query.projectScreenshot.findMany();
    await fixture.client.exec(
      `ALTER TABLE "Project" ADD CONSTRAINT test_project_failure CHECK ("title" <> 'Reject replacement')`,
    );
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    effects.revalidatePath.mockClear();
    try {
      const result = await actionUpdateProject(created.id, {
        ...projectInput,
        title: "Reject replacement",
        order: 1,
        structuredScreenshots: [
          { imageUrl: "https://example.test/new.webp", order: 0 },
        ],
      });
      expect(result).toEqual({
        success: false,
        error: "Failed to update project.",
        fieldErrors: undefined,
      });
      expect(errors).toHaveBeenCalled();
      expect(
        await fixture.db.query.project.findMany({
          orderBy: asc(schema.project.id),
        }),
      ).toEqual(beforeProjects);
      expect(await fixture.db.query.projectScreenshot.findMany()).toEqual(
        beforeScreenshots,
      );
      expect(effects.revalidatePath).not.toHaveBeenCalled();
    } finally {
      await fixture.client.exec(
        'ALTER TABLE "Project" DROP CONSTRAINT test_project_failure',
      );
    }
  });

  it("shifts gallery neighbors in both directions and inserts at the requested position", async () => {
    const rows = await seedGallery();
    actionData(
      await actionUpdateGalleryItem(rows[3].id, { ...galleryInput, order: 1 }),
    );
    expect(await galleryOrders()).toEqual([
      { id: rows[0].id, order: 0 },
      { id: rows[3].id, order: 1 },
      { id: rows[1].id, order: 2 },
      { id: rows[2].id, order: 3 },
    ]);
    actionData(
      await actionUpdateGalleryItem(rows[3].id, { ...galleryInput, order: 3 }),
    );
    expect(await galleryOrders()).toEqual(
      rows.map((row) => ({ id: row.id, order: row.order })),
    );
    const inserted = actionData(
      await actionCreateGalleryItem({ ...galleryInput, order: 1 }),
    );
    expect(await galleryOrders()).toEqual([
      { id: rows[0].id, order: 0 },
      { id: inserted.id, order: 1 },
      { id: rows[1].id, order: 2 },
      { id: rows[2].id, order: 3 },
      { id: rows[3].id, order: 4 },
    ]);
  });

  it("appends a zero-order gallery creation after the current last item", async () => {
    const rows = await seedGallery();
    const created = actionData(
      await actionCreateGalleryItem({ ...galleryInput, order: 0 }),
    );
    expect(await galleryOrders()).toEqual([
      ...rows.map((row) => ({ id: row.id, order: row.order })),
      { id: created.id, order: 4 },
    ]);
  });

  it("rolls back gallery shifts when an insert or update violates a PostgreSQL constraint", async () => {
    const rows = await seedGallery();
    const before = await fixture.db.query.galleryItem.findMany({
      orderBy: asc(schema.galleryItem.id),
    });
    await fixture.client.exec(
      `ALTER TABLE "GalleryItem" ADD CONSTRAINT test_gallery_failure CHECK ("imageUrl" <> 'https://example.test/rejected.webp')`,
    );
    vi.spyOn(console, "error").mockImplementation(() => {});
    effects.revalidatePath.mockClear();
    const invalid = {
      ...galleryInput,
      imageUrl: "https://example.test/rejected.webp",
      order: 1,
    };
    try {
      expect((await actionCreateGalleryItem(invalid)).success).toBe(false);
      expect(
        await fixture.db.query.galleryItem.findMany({
          orderBy: asc(schema.galleryItem.id),
        }),
      ).toEqual(before);
      expect((await actionUpdateGalleryItem(rows[3].id, invalid)).success).toBe(
        false,
      );
      expect(
        await fixture.db.query.galleryItem.findMany({
          orderBy: asc(schema.galleryItem.id),
        }),
      ).toEqual(before);
      expect(effects.revalidatePath).not.toHaveBeenCalled();
    } finally {
      await fixture.client.exec(
        'ALTER TABLE "GalleryItem" DROP CONSTRAINT test_gallery_failure',
      );
    }
  });

  it("commits gallery reordering together and rolls it back if a later item is missing", async () => {
    const rows = await seedGallery();
    expect(
      (
        await actionReorderGalleryItems(
          rows.map((row, index) => ({ id: row.id, order: 3 - index })),
        )
      ).success,
    ).toBe(true);
    const before = await galleryOrders();
    expect(before.map((row) => row.id)).toEqual(
      rows.map((row) => row.id).reverse(),
    );
    vi.spyOn(console, "error").mockImplementation(() => {});
    effects.revalidatePath.mockClear();
    expect(
      (
        await actionReorderGalleryItems([
          { id: rows[0].id, order: 99 },
          { id: "missing-gallery-item", order: 0 },
        ])
      ).success,
    ).toBe(false);
    expect(await galleryOrders()).toEqual(before);
    expect(effects.revalidatePath).not.toHaveBeenCalled();
  });
});
