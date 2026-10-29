import { eq } from "drizzle-orm";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  actionCreatePost,
  actionPublishPost,
  actionPublishPosts,
  actionSavePostDraft,
  actionUpdatePost,
} from "@/features/dashboard/posts/actions";
import {
  postActionSchema,
  postFormSchema,
} from "@/features/dashboard/posts/validations";
import type { ActionResult } from "@/lib/action-result";
import { PostStatus } from "@/lib/db/enums";
import { post, user } from "@/lib/db/schema";
import { createTestDatabase } from "../helpers/database";

type Fixture = Awaited<ReturnType<typeof createTestDatabase>>;
const effects = vi.hoisted(() => ({
  db: undefined as Fixture["db"] | undefined,
  session: vi.fn(),
  revalidatePath: vi.fn(),
  updateTag: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  get db() {
    if (!effects.db) throw new Error("Fixture not initialized");
    return effects.db;
  },
}));
vi.mock("@/lib/auth-session", () => ({ getActionSession: effects.session }));
vi.mock("next/cache", () => ({
  revalidatePath: effects.revalidatePath,
  updateTag: effects.updateTag,
}));

let fixture: Fixture;
const future = "2099-03-04T05:06:07.000Z";
const input = {
  title: "Publication regression",
  slug: "publication-regression",
  content: "Safe **Markdown** content.",
  tags: "",
  status: "published" as const,
};
function data<T>(result: ActionResult<T>): T {
  expect(result.success, JSON.stringify(result)).toBe(true);
  if (!result.success || !result.data) throw new Error("Missing action data");
  return result.data;
}
const stored = (id: string) =>
  fixture.db.query.post.findFirst({ where: eq(post.id, id) });
const rows = () => fixture.db.select().from(post).orderBy(post.id);

beforeAll(async () => {
  fixture = await createTestDatabase();
  effects.db = fixture.db;
  await fixture.db
    .insert(user)
    .values({ id: "owner", email: "publication@example.test" });
});
beforeEach(async () => {
  vi.clearAllMocks();
  effects.session.mockResolvedValue({ user: { id: "owner" } });
  await fixture.db.delete(post);
});
afterAll(async () => fixture?.client.close());

describe("post publication intent", () => {
  for (const [name, schema] of [
    ["form", postFormSchema],
    ["action", postActionSchema],
  ] as const) {
    it(`${name}: defaults omitted intent to keep and requires a valid date when scheduling publication`, () => {
      expect(schema.parse(input)).toHaveProperty("publicationIntent", "keep");
      for (const scheduledPublishDate of [undefined, "", "not-a-date"]) {
        const result = schema.safeParse({
          ...input,
          publicationIntent: "schedule",
          scheduledPublishDate,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.flatten().fieldErrors).toHaveProperty(
            "scheduledPublishDate",
          );
        }
      }
      expect(
        schema.safeParse({
          ...input,
          publicationIntent: "schedule",
          scheduledPublishDate: future,
        }).success,
      ).toBe(true);
      expect(
        schema.safeParse({
          ...input,
          status: "draft",
          publicationIntent: "schedule",
        }).success,
      ).toBe(true);
    });
  }

  it("rejects scheduling without a date before creating or changing a post", async () => {
    const invalid = { ...input, publicationIntent: "schedule" as const };
    expect(await actionCreatePost(invalid)).toMatchObject({
      success: false,
      fieldErrors: { scheduledPublishDate: expect.any(Array) },
    });
    expect(await rows()).toEqual([]);
    const created = data(await actionCreatePost(input));
    const before = await rows();
    expect((await actionUpdatePost(created.id, invalid)).success).toBe(false);
    expect(await rows()).toEqual(before);
  });

  it("requires authentication for create and every manual publication path", async () => {
    const created = data(await actionCreatePost({ ...input, status: "draft" }));
    const before = await rows();
    vi.clearAllMocks();
    effects.session.mockRejectedValue(new Error("Unauthorized"));
    for (const action of [
      () => actionCreatePost({ ...input, slug: "unauthorized-create" }),
      () => actionUpdatePost(created.id, input),
      () => actionPublishPost(input, created.id),
      () => actionSavePostDraft(input, created.id),
    ]) {
      expect(await action()).toMatchObject({
        success: false,
        error: "Unauthorized",
      });
    }
    expect(await rows()).toEqual(before);
    expect(effects.updateTag).not.toHaveBeenCalled();
  });

  it.each([
    undefined,
    "now",
  ] as const)("creates a current publication date with intent %s and returns the persisted value", async (publicationIntent) => {
    const before = Date.now();
    const result = await actionCreatePost({
      ...input,
      publicationIntent,
      scheduledPublishDate: publicationIntent === "now" ? future : undefined,
    });
    const after = Date.now();
    const persisted = (await stored(data(result).id))?.publishedAt;
    expect(persisted?.getTime()).toBeGreaterThanOrEqual(before);
    expect(persisted?.getTime()).toBeLessThanOrEqual(after);
    expect(result).toMatchObject({
      success: true,
      message: "Post published.",
      data: { publishedAt: persisted?.toISOString() },
    });
  });

  it("returns the persisted ISO date and scheduled message on create and manual publish", async () => {
    const created = data(await actionCreatePost({ ...input, status: "draft" }));
    expect(created).toHaveProperty("publishedAt", null);
    const result = await actionPublishPost(
      {
        ...input,
        publicationIntent: "schedule",
        scheduledPublishDate: "2099-03-04T12:06:07+07:00",
      },
      created.id,
    );
    expect(result).toMatchObject({
      success: true,
      message: "Post scheduled.",
      data: { status: "published", publishedAt: future },
    });
    expect((await stored(created.id))?.publishedAt?.toISOString()).toBe(future);

    const scheduled = await actionCreatePost({
      ...input,
      slug: "scheduled-create",
      publicationIntent: "schedule",
      scheduledPublishDate: future,
    });
    expect(scheduled).toMatchObject({
      success: true,
      message: "Post scheduled.",
      data: { publishedAt: future },
    });
    expect((await stored(data(scheduled).id))?.publishedAt?.toISOString()).toBe(
      future,
    );
  });

  it("publish now overrides an existing schedule and a supplied future date", async () => {
    const created = data(
      await actionCreatePost({ ...input, scheduledPublishDate: future }),
    );
    const before = Date.now();
    const result = await actionPublishPost(
      { ...input, publicationIntent: "now", scheduledPublishDate: future },
      created.id,
    );
    const after = Date.now();
    const persisted = (await stored(created.id))?.publishedAt;
    expect(persisted?.getTime()).toBeGreaterThanOrEqual(before);
    expect(persisted?.getTime()).toBeLessThanOrEqual(after);
    expect(result).toMatchObject({
      success: true,
      message: "Post published.",
      data: { status: "published", publishedAt: persisted?.toISOString() },
    });
  });

  it.each([
    "keep",
    undefined,
  ] as const)("%s keeps the existing date and supports legacy rescheduling with a supplied date", async (publicationIntent) => {
    const created = data(
      await actionCreatePost({ ...input, scheduledPublishDate: future }),
    );
    expect(
      await actionUpdatePost(created.id, { ...input, publicationIntent }),
    ).toMatchObject({
      success: true,
      message: "Post scheduled.",
      data: { publishedAt: future },
    });
    expect((await stored(created.id))?.publishedAt?.toISOString()).toBe(future);
    const nextDate = "2099-04-05T06:07:08.000Z";
    expect(
      await actionUpdatePost(created.id, {
        ...input,
        publicationIntent,
        scheduledPublishDate: nextDate,
      }),
    ).toMatchObject({ success: true, data: { publishedAt: nextDate } });
    expect((await stored(created.id))?.publishedAt?.toISOString()).toBe(
      nextDate,
    );
  });

  it("draft saves clear the persisted date regardless of schedule intent", async () => {
    const created = data(
      await actionCreatePost({ ...input, scheduledPublishDate: future }),
    );
    expect(
      await actionSavePostDraft(
        {
          ...input,
          publicationIntent: "schedule",
          scheduledPublishDate: future,
        },
        created.id,
      ),
    ).toMatchObject({
      success: true,
      message: "Draft saved.",
      data: { status: "draft", publishedAt: null },
    });
    expect(await stored(created.id)).toMatchObject({
      status: PostStatus.DRAFT,
      publishedAt: null,
    });
  });

  it("keeps the original live date when editing a published post without a date", async () => {
    const publishedAt = "2020-01-02T03:04:05.000Z";
    const created = data(
      await actionCreatePost({ ...input, scheduledPublishDate: publishedAt }),
    );
    expect(
      await actionUpdatePost(created.id, {
        ...input,
        content: "Updated body.",
      }),
    ).toMatchObject({
      success: true,
      message: "Post published.",
      data: { status: "published", publishedAt },
    });
    expect((await stored(created.id))?.publishedAt?.toISOString()).toBe(
      publishedAt,
    );
  });
});

describe("atomic batch post publication", () => {
  beforeEach(async () => {
    await fixture.db.insert(post).values(
      [
        { id: "ready", title: "Ready post", content: "Ready to publish." },
        { id: "ready-two", title: "Second ready post", content: "Also ready." },
        { id: "empty", title: "Empty post", content: " \n " },
        { id: "unsafe", title: "Unsafe post", content: "{process.env.SECRET}" },
        {
          id: "invalid",
          title: "Invalid post",
          content: "x",
          excerpt: "x".repeat(281),
        },
      ].map((row) => ({
        ...row,
        slug: row.id,
        status: PostStatus.DRAFT,
        authorId: "owner",
      })),
    );
  });

  it.each([
    ["empty", "Empty post"],
    ["unsafe", "Unsafe post"],
    ["invalid", "Invalid post"],
  ])("rejects %s with its title and leaves every selected row untouched", async (id, title) => {
    const before = await rows();
    expect(await actionPublishPosts(["ready", id])).toMatchObject({
      success: false,
      error: expect.stringContaining(`Cannot publish "${title}"`),
    });
    expect(await rows()).toEqual(before);
    expect(effects.updateTag).not.toHaveBeenCalled();
    expect(effects.revalidatePath).not.toHaveBeenCalled();
  });

  it("rejects missing IDs atomically even when the selection includes duplicates", async () => {
    const before = await rows();
    expect(
      await actionPublishPosts(["ready", "ready", "missing"]),
    ).toMatchObject({
      success: false,
      error: expect.stringContaining("selection changed"),
    });
    expect(await rows()).toEqual(before);
    expect(effects.updateTag).not.toHaveBeenCalled();
  });

  it("publishes each selected draft once and preserves already published schedules", async () => {
    await fixture.db
      .update(post)
      .set({
        status: PostStatus.PUBLISHED,
        publishedAt: new Date(future),
      })
      .where(eq(post.id, "unsafe"));
    const scheduled = await stored("unsafe");
    const before = Date.now();
    expect(
      await actionPublishPosts(["ready", "ready-two", "ready", "unsafe"]),
    ).toMatchObject({
      success: true,
      data: { count: 2 },
    });
    const after = Date.now();
    for (const id of ["ready", "ready-two"]) {
      const saved = await stored(id);
      expect(saved?.status).toBe(PostStatus.PUBLISHED);
      expect(saved?.publishedAt?.getTime()).toBeGreaterThanOrEqual(before);
      expect(saved?.publishedAt?.getTime()).toBeLessThanOrEqual(after);
      expect(effects.revalidatePath).toHaveBeenCalledWith(`/blog/${id}`);
    }
    expect((await stored("ready"))?.publishedAt).toEqual(
      (await stored("ready-two"))?.publishedAt,
    );
    expect(await stored("unsafe")).toEqual(scheduled);
    expect((await stored("empty"))?.status).toBe(PostStatus.DRAFT);
    expect(effects.updateTag).toHaveBeenCalledWith("public-posts");
  });

  it("requires authentication and a nonempty selection before modifying posts", async () => {
    const before = await rows();
    effects.session.mockRejectedValueOnce(new Error("Unauthorized"));
    expect(await actionPublishPosts(["ready"])).toMatchObject({
      success: false,
      error: "Unauthorized",
    });
    expect((await actionPublishPosts([])).success).toBe(false);
    expect(await rows()).toEqual(before);
    expect(effects.updateTag).not.toHaveBeenCalled();
  });
});
