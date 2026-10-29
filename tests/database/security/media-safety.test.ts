import { eq } from "drizzle-orm";
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
  actionCheckMediaUsage,
  actionDeleteMedia,
  actionDeleteMediaBatch,
  actionRenameMedia,
} from "../../../src/features/dashboard/media/actions";
import { MEDIA_BATCH_LIMIT } from "../../../src/features/dashboard/media/constants";
import * as schema from "../../../src/lib/db/schema";
import { createTestDatabase } from "../../helpers/database";

type TestDatabase = Awaited<ReturnType<typeof createTestDatabase>>;
const effects = vi.hoisted(() => ({
  db: undefined as TestDatabase["db"] | undefined,
  session: vi.fn(),
  destroy: vi.fn(),
  revalidate: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  get db() {
    return effects.db;
  },
}));
vi.mock("@/lib/auth-session", () => ({ getActionSession: effects.session }));
vi.mock("@/lib/cloudinary", () => ({ deleteFromCloudinary: effects.destroy }));
vi.mock("next/cache", () => ({ revalidatePath: effects.revalidate }));

let fixture: TestDatabase;
beforeAll(async () => {
  fixture = await createTestDatabase();
  effects.db = fixture.db;
  await fixture.client.exec(`CREATE FUNCTION reject_media_delete() RETURNS trigger AS $$
    BEGIN IF OLD.id = 'db-fail' THEN RAISE EXCEPTION 'fixture rejection'; END IF;
    IF OLD.id = 'db-skip' THEN RETURN NULL; END IF;
    RETURN OLD; END; $$ LANGUAGE plpgsql`);
});
beforeEach(async () => {
  await fixture.client.exec(`DROP TRIGGER IF EXISTS media_delete_failure ON "Media";
    TRUNCATE "Media", "AboutContent", "HomeSection" CASCADE`);
  vi.resetAllMocks();
  effects.session.mockResolvedValue({ user: { id: "owner" } });
  effects.destroy.mockResolvedValue(true);
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());
afterAll(async () => {
  await fixture?.client.close();
});

async function seed(ids: string[]) {
  await fixture.db.insert(schema.media).values(
    ids.map((id) => ({
      id,
      publicId: `media/${id}`,
      filename: `${id}.png`,
      url: `https://example.test/${id}.png`,
      size: 1,
      format: "png",
    })),
  );
}
async function remaining() {
  return (await fixture.db.query.media.findMany()).map(({ id }) => id).sort();
}
async function rejectDbDelete() {
  await fixture.client.exec(`CREATE TRIGGER media_delete_failure BEFORE DELETE ON "Media"
    FOR EACH ROW EXECUTE FUNCTION reject_media_delete()`);
}

describe("Media deletion safety", () => {
  it("reports a committed rename as successful when revalidation fails", async () => {
    await seed(["renamed"]);
    effects.revalidate.mockImplementation(() => {
      throw new Error("cache failed");
    });
    expect(await actionRenameMedia("renamed", "New image.png")).toMatchObject({
      success: true,
      data: { id: "renamed", filename: "New image.png" },
    });
    expect(
      await fixture.db.query.media.findFirst({
        where: eq(schema.media.id, "renamed"),
      }),
    ).toMatchObject({ filename: "New image.png" });
  });
  it.each([
    "howIWorkEn",
    "howIWorkId",
    "whatIValueEn",
    "whatIValueId",
  ] as const)(
    "protects a literal URL referenced only in About %s",
    async (field) => {
      await seed(["used", "free"]);
      const url = "https://example.test/a_b%20c.png";
      await fixture.db
        .update(schema.media)
        .set({ url })
        .where(eq(schema.media.id, "used"));
      await fixture.db
        .update(schema.media)
        .set({ url: "https://example.test/axbZZ20c.png" })
        .where(eq(schema.media.id, "free"));
      await fixture.db
        .insert(schema.aboutContent)
        .values({ [field]: `![asset](${url})` });
      expect(await actionCheckMediaUsage(["used", "free"])).toMatchObject({
        success: true,
        data: {
          blocked: [
            { id: "used", references: [{ label: "about content", count: 1 }] },
          ],
          canDelete: [{ id: "free" }],
        },
      });
      expect(await actionDeleteMedia("used")).toMatchObject({ success: false });
      expect(await actionDeleteMediaBatch(["used", "free"])).toMatchObject({
        success: false,
      });
      expect(effects.destroy).not.toHaveBeenCalled();
      expect(await remaining()).toEqual(["free", "used"]);
    },
  );

  it.each([false, new Error("provider secret must not leak")])(
    "keeps the single row when remote deletion fails (%s)",
    async (outcome) => {
      await seed(["asset"]);
      if (outcome instanceof Error) effects.destroy.mockRejectedValue(outcome);
      else effects.destroy.mockResolvedValue(outcome);
      expect(await actionDeleteMedia("asset")).toMatchObject({
        success: false,
        error: expect.stringMatching(/retry/i),
      });
      expect(await remaining()).toEqual(["asset"]);
      expect(effects.revalidate).not.toHaveBeenCalled();
      expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain(
        "provider secret",
      );
    },
  );

  it("reports DB failure after remote success and permits a reconciliation retry", async () => {
    await seed(["db-fail"]);
    await rejectDbDelete();
    expect(await actionDeleteMedia("db-fail")).toMatchObject({
      success: false,
      error: expect.stringMatching(/remote.*removed.*retry/i),
    });
    expect(await remaining()).toEqual(["db-fail"]);
    await fixture.client.exec('DROP TRIGGER media_delete_failure ON "Media"');
    // The boolean adapter also returns true for a confirmed provider 'not found'.
    expect(await actionDeleteMedia("db-fail")).toMatchObject({ success: true });
    expect(await remaining()).toEqual([]);
  });

  it.each([false, true])(
    "does not report deletion when the DB retains the row without throwing (batch=%s)",
    async (batch) => {
      await seed(["db-skip"]);
      await rejectDbDelete();
      const result = await (batch
        ? actionDeleteMediaBatch(["db-skip"])
        : actionDeleteMedia("db-skip"));
      expect(result).toMatchObject(
        batch
          ? {
              success: true,
              data: {
                deletedIds: [],
                failedItems: [
                  { id: "db-skip", error: expect.stringMatching(/retry/i) },
                ],
              },
            }
          : { success: false, error: expect.stringMatching(/retry/i) },
      );
      expect(await remaining()).toEqual(["db-skip"]);
      expect(effects.revalidate).not.toHaveBeenCalled();
    },
  );

  it("reports only completed IDs and per-item retries after mixed remote and SQL failures", async () => {
    await seed(["good", "remote-false", "remote-throw", "db-fail"]);
    await rejectDbDelete();
    effects.destroy.mockImplementation(async (id: string) => {
      if (id === "media/remote-throw") throw new Error("provider secret");
      return id !== "media/remote-false";
    });
    expect(
      await actionDeleteMediaBatch([
        "good",
        "remote-false",
        "remote-throw",
        "db-fail",
      ]),
    ).toMatchObject({
      success: true,
      data: {
        deletedIds: ["good"],
        failedItems: expect.arrayContaining([
          {
            id: "remote-false",
            filename: "remote-false.png",
            error: expect.stringMatching(/retry/i),
          },
          {
            id: "remote-throw",
            filename: "remote-throw.png",
            error: expect.stringMatching(/retry/i),
          },
          {
            id: "db-fail",
            filename: "db-fail.png",
            error: expect.stringMatching(/remote.*removed.*retry/i),
          },
        ]),
      },
    });
    expect(await remaining()).toEqual([
      "db-fail",
      "remote-false",
      "remote-throw",
    ]);
    expect(effects.revalidate).toHaveBeenCalledOnce();
    await fixture.client.exec('DROP TRIGGER media_delete_failure ON "Media"');
    effects.destroy.mockResolvedValue(true);
    expect(await actionDeleteMediaBatch(await remaining())).toMatchObject({
      success: true,
      data: {
        deletedIds: expect.arrayContaining([
          "db-fail",
          "remote-false",
          "remote-throw",
        ]),
      },
    });
    expect(await remaining()).toEqual([]);
  });

  it("returns data even if every provider call fails", async () => {
    await seed(["one", "two"]);
    effects.destroy.mockResolvedValue(false);
    expect(await actionDeleteMediaBatch(["one", "two"])).toMatchObject({
      success: true,
      data: { deletedIds: [], failedItems: [{ id: "one" }, { id: "two" }] },
    });
    expect(await remaining()).toEqual(["one", "two"]);
    expect(effects.revalidate).not.toHaveBeenCalled();
  });

  it("rechecks references at execution and rejects the entire batch before provider calls", async () => {
    await seed(["one", "two"]);
    expect(await actionCheckMediaUsage(["one", "two"])).toMatchObject({
      success: true,
      data: { blocked: [] },
    });
    await fixture.db
      .insert(schema.aboutContent)
      .values({ howIWorkEn: "![new](https://example.test/two.png)" });
    expect(await actionDeleteMediaBatch(["one", "two"])).toMatchObject({
      success: false,
      error: expect.stringContaining("two.png"),
    });
    expect(effects.destroy).not.toHaveBeenCalled();
    expect(await remaining()).toEqual(["one", "two"]);
  });

  it.each([actionCheckMediaUsage, actionDeleteMediaBatch])(
    "rejects oversized or malformed inputs before querying",
    async (action) => {
      const query = vi.spyOn(fixture.db.query.media, "findMany");
      for (const ids of [
        Array.from({ length: 101 }, (_, i) => `${i}`),
        [""],
        [2],
        null,
      ]) {
        expect(await action(ids as string[])).toMatchObject({ success: false });
      }
      expect(query).not.toHaveBeenCalled();
      expect(effects.destroy).not.toHaveBeenCalled();
    },
  );

  it("authenticates before input checks or database/provider access", async () => {
    effects.session.mockRejectedValue(new Error("Unauthorized"));
    const query = vi.spyOn(fixture.db.query.media, "findMany");
    const single = vi.spyOn(fixture.db.query.media, "findFirst");
    expect(
      await actionCheckMediaUsage(null as unknown as string[]),
    ).toMatchObject({ error: "Unauthorized" });
    expect(
      await actionDeleteMediaBatch(null as unknown as string[]),
    ).toMatchObject({ error: "Unauthorized" });
    expect(await actionDeleteMedia("one")).toMatchObject({
      error: "Unauthorized",
    });
    expect(query).not.toHaveBeenCalled();
    expect(single).not.toHaveBeenCalled();
    expect(effects.destroy).not.toHaveBeenCalled();
  });

  it("bounds concurrent provider work to three and deduplicates IDs", async () => {
    const ids = Array.from({ length: 10 }, (_, i) => `asset-${i}`);
    await seed(ids);
    let active = 0;
    let peak = 0;
    effects.destroy.mockImplementation(async () => {
      peak = Math.max(peak, ++active);
      await new Promise<void>((resolve) => setImmediate(resolve));
      active--;
      return true;
    });
    const result = await actionDeleteMediaBatch([...ids, ids[0]]);
    expect(result).toMatchObject({
      success: true,
      data: { deletedIds: expect.arrayContaining(ids) },
    });
    expect(effects.destroy).toHaveBeenCalledTimes(ids.length);
    expect(peak).toBeLessThanOrEqual(3);
    expect(await remaining()).toEqual([]);
  });

  it("accepts exactly 100 items and bounds active reference queries to three", async () => {
    expect(MEDIA_BATCH_LIMIT).toBe(100);
    const ids = Array.from({ length: 100 }, (_, i) => `boundary-${i}`);
    await seed(ids);
    let active = 0;
    let peak = 0;
    const originalCount = fixture.db.$count.bind(fixture.db);
    vi.spyOn(fixture.db, "$count").mockImplementation((source, filter) => {
      const query = originalCount(source, filter);
      const execute = query.then.bind(query);
      query.then = (onfulfilled, onrejected) => {
        peak = Math.max(peak, ++active);
        return execute(onfulfilled, onrejected).finally(() => {
          active--;
        });
      };
      return query;
    });
    const result = await actionCheckMediaUsage(ids);
    expect(result).toMatchObject({ success: true, data: { blocked: [] } });
    if (!result.success || !result.data)
      throw new Error("Expected usage preview");
    expect(result.data.canDelete).toHaveLength(100);
    expect(peak).toBeGreaterThan(0);
    expect(peak).toBeLessThanOrEqual(3);
    expect(active).toBe(0);
  });

  it("fails closed before any provider call when execution reference checks fail", async () => {
    await seed(["one", "two"]);
    vi.spyOn(fixture.db, "$count").mockImplementationOnce(() => {
      throw new Error("db secret");
    });
    expect(await actionDeleteMediaBatch(["one", "two"])).toMatchObject({
      success: false,
    });
    expect(effects.destroy).not.toHaveBeenCalled();
    expect(await remaining()).toEqual(["one", "two"]);
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain(
      "db secret",
    );
  });

  it.each([false, true])(
    "preserves completed deletion results when revalidation throws (batch=%s)",
    async (batch) => {
      await seed(["done"]);
      effects.revalidate.mockImplementation(() => {
        throw new Error("cache secret");
      });
      expect(
        await (batch
          ? actionDeleteMediaBatch(["done"])
          : actionDeleteMedia("done")),
      ).toMatchObject({ success: true });
      expect(await remaining()).toEqual([]);
    },
  );
});
