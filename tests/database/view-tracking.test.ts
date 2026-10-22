import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { POST } from "../../src/app/api/views/[slug]/route";
import * as schema from "../../src/lib/db/schema";
import { createTestDatabase } from "../helpers/database";

type Fixture = Awaited<ReturnType<typeof createTestDatabase>>;
const state = vi.hoisted(() => ({
  db: undefined as Fixture["db"] | undefined,
}));
vi.mock("@/lib/db", () => ({
  get db() {
    if (!state.db) throw new Error("Test DB unavailable");
    return state.db;
  },
}));
let fixture: Fixture;
beforeAll(async () => {
  fixture = await createTestDatabase();
  state.db = fixture.db;
});
beforeEach(async () => {
  await fixture.db.delete(schema.viewEvent);
  await fixture.db.delete(schema.user);
  await fixture.db
    .insert(schema.user)
    .values({ id: "view-owner", email: "views@example.test" });
});
afterAll(async () => {
  state.db = undefined;
  await fixture.client.close();
});

function request(slug: string, type: string, cookie?: string) {
  return new NextRequest("https://storylio.test/api/views/" + slug, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: JSON.stringify({ type }),
  });
}
function params(slug: string) {
  return { params: Promise.resolve({ slug }) };
}

describe("view tracking PostgreSQL transactions", () => {
  it("increments a published post once and keeps the event/cookie deduplication", async () => {
    await fixture.db.insert(schema.post).values({
      title: "Viewed",
      slug: "viewed",
      content: "Content",
      status: "PUBLISHED",
      authorId: "view-owner",
    });
    const first = await POST(request("viewed", "post"), params("viewed"));
    expect(await first.json()).toEqual({ views: 1, deduplicated: false });
    const cookie = first.headers.get("set-cookie")?.split(";")[0];
    expect(cookie).toBeTruthy();
    const repeated = await POST(
      request("viewed", "post", cookie),
      params("viewed"),
    );
    expect(await repeated.json()).toEqual({ views: 1, deduplicated: true });
    expect(await fixture.db.query.viewEvent.findMany()).toHaveLength(1);
  });

  it("rolls back a project increment if recording the event fails", async () => {
    const [project] = await fixture.db
      .insert(schema.project)
      .values({
        title: "Rollback",
        slug: "rollback",
        status: "PUBLISHED",
        authorId: "view-owner",
      })
      .returning();
    await fixture.client.exec(
      "ALTER TABLE \"ViewEvent\" ADD CONSTRAINT view_test_failure CHECK (slug <> 'rollback')",
    );
    try {
      await expect(
        POST(request("rollback", "project"), params("rollback")),
      ).rejects.toThrow();
      expect(
        (
          await fixture.db.query.project.findFirst({
            where: eq(schema.project.id, project.id),
          })
        )?.viewCount,
      ).toBe(0);
      expect(await fixture.db.query.viewEvent.findMany()).toHaveLength(0);
    } finally {
      await fixture.client.exec(
        'ALTER TABLE "ViewEvent" DROP CONSTRAINT view_test_failure',
      );
    }
  });

  it("rejects drafts and future posts without recording views", async () => {
    await fixture.db.insert(schema.post).values([
      {
        title: "Draft",
        slug: "draft",
        content: "Content",
        status: "DRAFT",
        authorId: "view-owner",
      },
      {
        title: "Future",
        slug: "future",
        content: "Content",
        status: "PUBLISHED",
        publishedAt: new Date(Date.now() + 3_600_000),
        authorId: "view-owner",
      },
    ]);
    for (const slug of ["draft", "future"]) {
      expect((await POST(request(slug, "post"), params(slug))).status).toBe(
        404,
      );
    }
    expect(await fixture.db.query.viewEvent.findMany()).toHaveLength(0);
  });
});
