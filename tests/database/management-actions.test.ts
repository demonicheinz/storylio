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
import { actionUpdateAboutContent } from "../../src/features/dashboard/about/actions";
import { actionReorderSkills } from "../../src/features/dashboard/about/structured-actions";
import {
  actionCreateHomeSection,
  actionReorderHomeSections,
  actionUpdateHomeSection,
} from "../../src/features/dashboard/home/actions";
import {
  actionCheckMediaUsage,
  actionDeleteMedia,
  actionDeleteMediaBatch,
} from "../../src/features/dashboard/media/actions";
import * as schema from "../../src/lib/db/schema";
import {
  getHomeLogoSettings,
  selectHomeTechnologies,
} from "../../src/lib/home-technologies";
import { createTestDatabase } from "../helpers/database";

type TestDatabase = Awaited<ReturnType<typeof createTestDatabase>>;

const effects = vi.hoisted(() => ({
  db: undefined as TestDatabase["db"] | undefined,
  getActionSession: vi.fn(),
  revalidatePath: vi.fn(),
  updateTag: vi.fn(),
  deleteFromCloudinary: vi.fn(),
}));

// Replace only the client binding; every query and transaction uses real SQL.
vi.mock("@/lib/db", () => ({
  get db() {
    if (!effects.db) throw new Error("Test database is not initialized");
    return effects.db;
  },
}));
vi.mock("@/lib/auth-session", () => ({
  getActionSession: effects.getActionSession,
}));
vi.mock("next/cache", () => ({
  revalidatePath: effects.revalidatePath,
  updateTag: effects.updateTag,
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));
vi.mock("@/lib/cloudinary", () => ({
  deleteFromCloudinary: effects.deleteFromCloudinary,
}));

let fixture: TestDatabase;

beforeAll(async () => {
  fixture = await createTestDatabase();
  effects.db = fixture.db;
  await fixture.client.exec(
    `ALTER TYPE "HomeSectionType" ADD VALUE IF NOT EXISTS 'HERO'`,
  );
}, 30_000);

beforeEach(async () => {
  await fixture.client.exec(`TRUNCATE TABLE
    "AboutContent", "SkillCategory", "HomeSection", "Media", "User"
    CASCADE`);
  vi.clearAllMocks();
  effects.getActionSession.mockResolvedValue({
    user: { id: "owner" },
    session: { token: "current-session" },
  });
  effects.deleteFromCloudinary.mockResolvedValue(undefined);
});

afterEach(() => vi.restoreAllMocks());

afterAll(async () => {
  await fixture?.client.close();
  effects.db = undefined;
});

describe("management actions against PostgreSQL", () => {
  it("persists custom technology visibility while preserving phase content and cache invalidation", async () => {
    const created = await actionCreateHomeSection({
      type: "LOGO",
      label: "Astro",
      category: "TECHNOLOGY",
      showOnHome: true,
      content: "Original note",
      imageUrl: "https://example.test/astro.svg",
    });
    if (!created.success || !created.data)
      throw new Error("Expected a created technology");
    const id = created.data.id;
    const read = () =>
      fixture.db.query.homeSection.findFirst({
        where: eq(schema.homeSection.id, id),
      });
    const visible = await read();
    expect(getHomeLogoSettings(visible!)).toEqual({
      category: "TECHNOLOGY",
      showOnHome: true,
      description: "Original note",
    });
    expect(selectHomeTechnologies([visible!])).toHaveLength(1);
    expect(
      await actionUpdateHomeSection(id, {
        type: "LOGO",
        label: "Astro",
        category: "TECHNOLOGY",
        showOnHome: false,
        content: "Original note",
        imageUrl: "https://example.test/astro.svg",
      }),
    ).toMatchObject({ success: true });
    expect(selectHomeTechnologies([(await read())!])).toHaveLength(0);
    expect(
      await actionUpdateHomeSection(id, {
        type: "PHASE",
        label: "Build",
        content: "Actual process description",
      }),
    ).toMatchObject({ success: true });
    expect(await read()).toMatchObject({
      type: "PHASE",
      content: "Actual process description",
      imageUrl: null,
    });
    expect(effects.updateTag).toHaveBeenCalledWith("public-home");
  });

  it("lets built-in technology logos be configured without an uploaded image", async () => {
    const created = await actionCreateHomeSection({
      type: "LOGO",
      label: "Next.js",
      category: "TECHNOLOGY",
      showOnHome: true,
    });
    expect(created.success).toBe(true);
  });

  it("updates the newest About row, breaks ties by ID, and removes duplicates", async () => {
    const createdAt = new Date("2020-01-01T00:00:00Z");
    const newest = new Date("2021-01-01T00:00:00Z");
    await fixture.db.insert(schema.aboutContent).values([
      { id: "older", introEn: "Old", createdAt, updatedAt: createdAt },
      { id: "z-newest", introEn: "Tie", createdAt, updatedAt: newest },
      { id: "a-newest", introEn: "Primary", createdAt, updatedAt: newest },
    ]);

    expect(
      await actionUpdateAboutContent({
        introEn: "Updated introduction",
        howIWorkEn: "## Workflow\n\nBuild carefully.",
        defaultLanguage: "id",
      }),
    ).toMatchObject({ success: true, data: { id: "a-newest" } });

    const rows = await fixture.db.query.aboutContent.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: "a-newest",
      introEn: "Updated introduction",
      howIWorkEn: "## Workflow\n\nBuild carefully.",
      introId: null,
      defaultLanguage: "id",
      createdAt,
    });
    expect(rows[0].updatedAt.getTime()).toBeGreaterThan(newest.getTime());
    expect(effects.revalidatePath.mock.calls).toEqual([
      ["/dashboard/about"],
      ["/about"],
    ]);
  });

  it("commits structured reorders and rolls back orders and timestamps for missing IDs", async () => {
    const originalDate = new Date("2020-01-01T00:00:00Z");
    await fixture.db
      .insert(schema.skillCategory)
      .values({ id: "category", name: "Tools" });
    await fixture.db.insert(schema.skill).values([
      {
        id: "first",
        categoryId: "category",
        name: "First",
        order: 0,
        updatedAt: originalDate,
      },
      {
        id: "second",
        categoryId: "category",
        name: "Second",
        order: 1,
        updatedAt: originalDate,
      },
    ]);

    expect(
      await actionReorderSkills(
        [
          { id: "second", order: 0 },
          { id: "first", order: 1 },
        ],
        "category",
      ),
    ).toMatchObject({ success: true });
    const committed = await fixture.db.query.skill.findMany({
      orderBy: asc(schema.skill.id),
    });
    expect(committed.map(({ id, order }) => ({ id, order }))).toEqual([
      { id: "first", order: 1 },
      { id: "second", order: 0 },
    ]);
    expect(
      committed.every(
        ({ updatedAt }) => updatedAt.getTime() > originalDate.getTime(),
      ),
    ).toBe(true);
    expect(effects.revalidatePath).toHaveBeenCalledWith("/about");

    effects.revalidatePath.mockClear();
    effects.updateTag.mockClear();
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(
      await actionReorderSkills(
        [
          { id: "missing", order: 0 },
          { id: "first", order: 1 },
        ],
        "category",
      ),
    ).toMatchObject({
      success: false,
      error: "The skill list changed. Refresh and try again.",
    });
    expect(
      await fixture.db.query.skill.findMany({ orderBy: asc(schema.skill.id) }),
    ).toEqual(committed);
    expect(effects.revalidatePath).not.toHaveBeenCalled();
    expect(effects.updateTag).not.toHaveBeenCalled();
  });

  it("blocks single and batch media deletion for literal content references", async () => {
    const url = "https://example.test/a_b%20c.png";
    await fixture.db
      .insert(schema.user)
      .values({ id: "owner", email: "owner@example.test" });
    await fixture.db.insert(schema.post).values({
      authorId: "owner",
      title: "Referenced",
      slug: "referenced",
      content: `Image: ![asset](${url})`,
    });
    await fixture.db.insert(schema.media).values([
      {
        id: "referenced",
        url,
        publicId: "cloud-referenced",
        filename: "referenced.png",
        size: 1,
        format: "png",
      },
      {
        id: "lookalike",
        url: "https://example.test/axbZZ20c.png",
        publicId: "cloud-lookalike",
        filename: "lookalike.png",
        size: 1,
        format: "png",
      },
    ]);

    expect(
      await actionCheckMediaUsage(["referenced", "lookalike"]),
    ).toMatchObject({
      success: true,
      data: {
        blocked: [
          {
            id: "referenced",
            references: [{ label: "post content", count: 1 }],
          },
        ],
        canDelete: [{ id: "lookalike", references: [] }],
      },
    });
    expect(await actionDeleteMedia("referenced")).toMatchObject({
      success: false,
      error: expect.stringContaining("1 post content"),
    });
    expect(
      await actionDeleteMediaBatch(["referenced", "lookalike"]),
    ).toMatchObject({
      success: false,
      error: expect.stringContaining("referenced.png"),
    });
    expect(await fixture.db.$count(schema.media)).toBe(2);
    expect(effects.deleteFromCloudinary).not.toHaveBeenCalled();
    expect(effects.revalidatePath).not.toHaveBeenCalled();
    expect(effects.updateTag).not.toHaveBeenCalled();
  });

  async function seedReorderSections() {
    await fixture.db.insert(schema.homeSection).values([
      { id: "phase-a", type: "PHASE", label: "A", order: 8 },
      { id: "phase-b", type: "PHASE", label: "B", order: 20 },
      { id: "logo-a", type: "LOGO", label: "Logo", order: 5 },
      { id: "home-hero", type: "HERO", label: "Hero", order: 99 },
    ]);
  }

  it("normalizes a complete group and leaves other types and HERO intact", async () => {
    await seedReorderSections();
    expect(
      await actionReorderHomeSections([
        { id: "phase-a", order: 50 },
        { id: "phase-b", order: 4 },
      ]),
    ).toMatchObject({ success: true });
    expect(
      await fixture.db.query.homeSection.findMany({
        columns: { id: true, order: true },
        orderBy: asc(schema.homeSection.id),
      }),
    ).toEqual([
      { id: "home-hero", order: 99 },
      { id: "logo-a", order: 5 },
      { id: "phase-a", order: 1 },
      { id: "phase-b", order: 0 },
    ]);
    expect(
      await actionReorderHomeSections([{ id: "logo-a", order: 12 }]),
    ).toMatchObject({ success: true });
    expect(
      await fixture.db.query.homeSection.findFirst({
        where: eq(schema.homeSection.id, "logo-a"),
      }),
    ).toMatchObject({ order: 0 });
    expect(effects.updateTag).toHaveBeenCalledWith("public-home");
  });

  it.each(
    [
      [],
      [{ id: "phase-a", order: 0 }],
      [
        { id: "phase-a", order: 0 },
        { id: "missing", order: 1 },
      ],
      [
        { id: "phase-a", order: 0 },
        { id: "phase-a", order: 1 },
      ],
      [
        { id: "phase-a", order: 0 },
        { id: "phase-b", order: 0 },
      ],
      [
        { id: "phase-a", order: 0 },
        { id: "logo-a", order: 1 },
      ],
      [{ id: "home-hero", order: 0 }],
      [
        { id: "phase-a", order: -1 },
        { id: "phase-b", order: 1 },
      ],
    ].map((input) => ({ input })),
  )("rejects invalid reorder $input without writes", async ({ input }) => {
    await seedReorderSections();
    const before = await fixture.db.query.homeSection.findMany({
      orderBy: asc(schema.homeSection.id),
    });
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await actionReorderHomeSections(input)).toMatchObject({
      success: false,
    });
    expect(
      await fixture.db.query.homeSection.findMany({
        orderBy: asc(schema.homeSection.id),
      }),
    ).toEqual(before);
    expect(effects.updateTag).not.toHaveBeenCalled();
    expect(effects.revalidatePath).not.toHaveBeenCalled();
  });

  it("rejects unauthorized reorder before opening a transaction", async () => {
    await seedReorderSections();
    effects.getActionSession.mockRejectedValue(new Error("Unauthorized"));
    const transaction = vi.spyOn(fixture.db, "transaction");
    expect(
      await actionReorderHomeSections([{ id: "logo-a", order: 0 }]),
    ).toMatchObject({ success: false, error: "Unauthorized" });
    expect(transaction).not.toHaveBeenCalled();
    expect(effects.updateTag).not.toHaveBeenCalled();
  });

  it("rolls back an earlier reorder update if a later SQL write fails", async () => {
    await seedReorderSections();
    const before = await fixture.db.query.homeSection.findMany({
      orderBy: asc(schema.homeSection.id),
    });
    await fixture.client.exec(
      `ALTER TABLE "HomeSection" ADD CONSTRAINT reject_reorder CHECK ("id" <> 'phase-b' OR "order" <> 1)`,
    );
    try {
      vi.spyOn(console, "error").mockImplementation(() => {});
      expect(
        await actionReorderHomeSections([
          { id: "phase-a", order: 0 },
          { id: "phase-b", order: 1 },
        ]),
      ).toMatchObject({ success: false });
      expect(
        await fixture.db.query.homeSection.findMany({
          orderBy: asc(schema.homeSection.id),
        }),
      ).toEqual(before);
      expect(effects.updateTag).not.toHaveBeenCalled();
      expect(effects.revalidatePath).not.toHaveBeenCalled();
    } finally {
      await fixture.client.exec(
        'ALTER TABLE "HomeSection" DROP CONSTRAINT reject_reorder',
      );
    }
  });

  it("shifts only the relevant Home groups when a section changes type", async () => {
    await fixture.db.insert(schema.homeSection).values([
      { id: "phase-first", type: "PHASE", label: "First", order: 0 },
      { id: "moving", type: "PHASE", label: "Moving", order: 1 },
      { id: "phase-last", type: "PHASE", label: "Last", order: 2 },
      { id: "logo-first", type: "LOGO", label: "Logo first", order: 0 },
      { id: "logo-last", type: "LOGO", label: "Logo last", order: 1 },
    ]);
    expect(
      await actionUpdateHomeSection("moving", {
        type: "LOGO",
        label: "Moving",
        imageUrl: "https://example.test/logo.png",
        order: 1,
      }),
    ).toMatchObject({ success: true, data: { id: "moving" } });
    const rows = await fixture.db.query.homeSection.findMany({
      columns: { id: true, type: true, order: true },
      orderBy: asc(schema.homeSection.id),
    });
    expect(rows).toEqual([
      { id: "logo-first", type: "LOGO", order: 0 },
      { id: "logo-last", type: "LOGO", order: 2 },
      { id: "moving", type: "LOGO", order: 1 },
      { id: "phase-first", type: "PHASE", order: 0 },
      { id: "phase-last", type: "PHASE", order: 1 },
    ]);
    expect(
      await actionUpdateHomeSection("moving", {
        type: "PHASE",
        label: "Moving",
        imageUrl: "https://example.test/logo.png",
        order: 1,
      }),
    ).toMatchObject({ success: true });
    expect(
      await fixture.db.query.homeSection.findFirst({
        where: eq(schema.homeSection.id, "moving"),
      }),
    ).toMatchObject({
      type: "PHASE",
      imageUrl: null,
      order: 1,
    });
    expect(
      await fixture.db.query.homeSection.findFirst({
        where: eq(schema.homeSection.id, "logo-last"),
      }),
    ).toMatchObject({ order: 1 });
    expect(
      await fixture.db.query.homeSection.findFirst({
        where: eq(schema.homeSection.id, "phase-last"),
      }),
    ).toMatchObject({ order: 2 });
  });

  it("rolls back both Home groups when the final section update violates a constraint", async () => {
    await fixture.db.insert(schema.homeSection).values([
      { id: "moving", type: "PHASE", label: "Moving", order: 0 },
      { id: "phase-last", type: "PHASE", label: "Last", order: 1 },
      { id: "logo", type: "LOGO", label: "Logo", order: 1 },
    ]);
    const before = await fixture.db.query.homeSection.findMany({
      orderBy: asc(schema.homeSection.id),
    });
    // A real SQL failure occurs after the two surrounding-order updates.
    await fixture.client.exec(`ALTER TABLE "HomeSection"
      ADD CONSTRAINT management_test_label CHECK ("label" <> 'Reject move')`);
    try {
      vi.spyOn(console, "error").mockImplementation(() => {});
      expect(
        await actionUpdateHomeSection("moving", {
          type: "LOGO",
          label: "Reject move",
          imageUrl: "https://example.test/logo.png",
          order: 1,
        }),
      ).toMatchObject({
        success: false,
        error: "Failed to update home section.",
      });
      expect(
        await fixture.db.query.homeSection.findMany({
          orderBy: asc(schema.homeSection.id),
        }),
      ).toEqual(before);
      expect(effects.revalidatePath).not.toHaveBeenCalled();
      expect(effects.updateTag).not.toHaveBeenCalled();
    } finally {
      await fixture.client.exec(
        'ALTER TABLE "HomeSection" DROP CONSTRAINT management_test_label',
      );
    }
  });
});
