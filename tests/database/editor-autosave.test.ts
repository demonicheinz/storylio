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
  actionAutosavePost,
  actionCreatePost,
  actionPublishPost,
  actionSavePostDraft,
} from "@/features/dashboard/posts/actions";
import {
  actionAutosaveProject,
  actionCreateProject,
  actionPublishProject,
  actionSaveProjectDraft,
} from "@/features/dashboard/projects/actions";
import type { ActionResult } from "@/lib/action-result";
import * as schema from "@/lib/db/schema";
import { createTestDatabase } from "../helpers/database";

type Fixture = Awaited<ReturnType<typeof createTestDatabase>>;
const effects = vi.hoisted(() => ({
  db: undefined as Fixture["db"] | undefined,
  session: vi.fn(),
  updateTag: vi.fn(),
  revalidatePath: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  get db() {
    if (!effects.db) throw new Error("Fixture not initialized");
    return effects.db;
  },
}));
vi.mock("@/lib/auth-session", () => ({ getActionSession: effects.session }));
vi.mock("next/cache", () => ({
  updateTag: effects.updateTag,
  revalidatePath: effects.revalidatePath,
}));

let fixture: Fixture;
function data<T>(result: ActionResult<T>): T {
  expect(result.success, JSON.stringify(result)).toBe(true);
  if (!result.success || !result.data) throw new Error("Missing action data");
  return result.data;
}
const input = {
  title: "Autosave regression",
  slug: "autosave-regression",
  content: "Original published content.",
  techStack: [],
  tags: [],
  status: "published" as const,
};

beforeAll(async () => {
  fixture = await createTestDatabase();
  effects.db = fixture.db;
});
beforeEach(async () => {
  vi.clearAllMocks();
  await fixture.client.exec('TRUNCATE "User", "Tag" CASCADE');
  const [owner] = await fixture.db
    .insert(schema.user)
    .values({ email: "autosave@example.test" })
    .returning();
  effects.session.mockResolvedValue({ user: { id: owner.id } });
});
afterAll(async () => fixture?.client.close());

describe("editor autosave publication regression", () => {
  for (const [name, create, autosave, publish, draft] of [
    [
      "post",
      actionCreatePost,
      actionAutosavePost,
      actionPublishPost,
      actionSavePostDraft,
    ],
    [
      "project",
      actionCreateProject,
      actionAutosaveProject,
      actionPublishProject,
      actionSaveProjectDraft,
    ],
  ] as const) {
    it(`${name}: ignores stale client status in both directions and allows explicit publication changes`, async () => {
      const created = data(await create({ ...input, status: "draft" }));
      expect(data(await autosave(input, created.id)).status).toBe("draft");
      expect(data(await publish(input, created.id)).status).toBe("published");
      expect(
        data(await autosave({ ...input, status: "draft" }, created.id)).status,
      ).toBe("published");
      expect(data(await draft(input, created.id)).status).toBe("draft");
      // An old autosave arriving after unpublishing must not republish the record.
      expect(data(await autosave(input, created.id)).status).toBe("draft");
    });

    it(`${name}: requires authentication, validates MDX, and refuses blank live content`, async () => {
      const created = data(await create(input));
      expect(
        (await autosave({ ...input, status: "draft", content: "" }, created.id))
          .success,
      ).toBe(false);
      expect(
        (
          await autosave(
            { ...input, content: "<script>alert(1)</script>" },
            created.id,
          )
        ).success,
      ).toBe(false);
      expect(
        (await autosave({ ...input, slug: "Invalid slug!" }, created.id))
          .success,
      ).toBe(false);
      effects.session.mockRejectedValueOnce(new Error("Unauthorized"));
      expect(await autosave(input, created.id)).toMatchObject({
        success: false,
        error: "Unauthorized",
      });
      const row =
        name === "post"
          ? await fixture.db.query.post.findFirst({
              where: eq(schema.post.id, created.id),
            })
          : await fixture.db.query.project.findFirst({
              where: eq(schema.project.id, created.id),
            });
      expect(row?.content).toBe(input.content);
      expect(row?.status).toBe("PUBLISHED");
    });

    it(`${name}: does not create a missing record and revalidates public data after autosave`, async () => {
      expect((await autosave(input, "missing")).success).toBe(false);
      const created = data(await create(input));
      vi.clearAllMocks();
      data(await autosave({ ...input, slug: "new-slug" }, created.id));
      expect(effects.updateTag).toHaveBeenCalledWith(
        name === "post" ? "public-posts" : "public-projects",
      );
      const path = name === "post" ? "/blog" : "/projects";
      expect(effects.revalidatePath).toHaveBeenCalledWith(
        `${path}/${input.slug}`,
      );
      expect(effects.revalidatePath).toHaveBeenCalledWith(`${path}/new-slug`);
    });
  }
  it("saves published post edits directly without changing publication or its date", async () => {
    const publishedAt = "2026-01-10T10:00:00.000Z";
    const created = data(
      await actionCreatePost({
        ...input,
        tags: ["original"],
        scheduledPublishDate: publishedAt,
      }),
    );
    const saved = data(
      await actionAutosavePost(
        {
          ...input,
          status: "draft",
          content: "Edited while published.",
          tags: ["updated"],
          publicationIntent: "schedule",
          scheduledPublishDate: "2030-01-01T00:00:00.000Z",
        },
        created.id,
      ),
    );
    expect(saved.status).toBe("published");
    expect(saved.publishedAt).toBe(publishedAt);
    const row = await fixture.db.query.post.findFirst({
      where: eq(schema.post.id, created.id),
      with: { tags: { with: { tag: true } } },
    });
    expect(row?.status).toBe("PUBLISHED");
    expect(row?.publishedAt?.toISOString()).toBe(publishedAt);
    expect(row?.content).toBe("Edited while published.");
    expect(row?.tags.map(({ tag }) => tag.name)).toEqual(["updated"]);
  });

  it("returns the actual scheduled or draft date despite autosave publication attempts", async () => {
    const publishedAt = "2099-01-01T00:00:00.000Z";
    const created = data(
      await actionCreatePost({ ...input, scheduledPublishDate: publishedAt }),
    );
    expect(
      data(
        await actionAutosavePost(
          { ...input, publicationIntent: "now" },
          created.id,
        ),
      ),
    ).toMatchObject({ status: "published", publishedAt });
    expect(
      (
        await fixture.db.query.post.findFirst({
          where: eq(schema.post.id, created.id),
        })
      )?.publishedAt?.toISOString(),
    ).toBe(publishedAt);
    data(await actionSavePostDraft(input, created.id));
    expect(
      data(
        await actionAutosavePost(
          {
            ...input,
            publicationIntent: "schedule",
            scheduledPublishDate: publishedAt,
          },
          created.id,
        ),
      ),
    ).toMatchObject({ status: "draft", publishedAt: null });
    expect(
      await fixture.db.query.post.findFirst({
        where: eq(schema.post.id, created.id),
      }),
    ).toMatchObject({ status: "DRAFT", publishedAt: null });
  });

  it("saves published project edits directly without moving them to draft", async () => {
    const created = data(await actionCreateProject(input));
    const saved = data(
      await actionAutosaveProject(
        {
          ...input,
          status: "draft",
          content: "Edited project.",
          techStack: ["TypeScript"],
          structuredScreenshots: [
            { imageUrl: "https://example.test/new.webp", order: 0 },
          ],
        },
        created.id,
      ),
    );
    expect(saved.status).toBe("published");
    const row = await fixture.db.query.project.findFirst({
      where: eq(schema.project.id, created.id),
      with: { structuredScreenshots: true },
    });
    expect(row?.status).toBe("PUBLISHED");
    expect(row?.content).toBe("Edited project.");
    expect(row?.structuredScreenshots[0].imageUrl).toBe(
      "https://example.test/new.webp",
    );
  });
});
