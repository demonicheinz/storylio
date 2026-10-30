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
import { POST } from "../../../src/app/api/upload/route";
import { createTestDatabase } from "../../helpers/database";

type TestDatabase = Awaited<ReturnType<typeof createTestDatabase>>;
const effects = vi.hoisted(() => ({
  db: undefined as TestDatabase["db"] | undefined,
  session: vi.fn(),
  upload: vi.fn(),
  destroy: vi.fn(),
  blur: vi.fn(),
  revalidate: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  get db() {
    return effects.db;
  },
}));
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: effects.session } },
}));
vi.mock("@/lib/owner-guard", () => ({
  isOwnerEmail: (email: string) => email === "owner@example.test",
}));
vi.mock("@/lib/cloudinary", () => ({
  uploadToCloudinary: effects.upload,
  deleteFromCloudinary: effects.destroy,
}));
vi.mock("@/lib/image-metadata", () => ({ generateBlurDataUrl: effects.blur }));
vi.mock("next/cache", () => ({ revalidatePath: effects.revalidate }));

const remote = {
  url: "https://example.test/upload.png",
  publicId: "media/upload",
  format: "png",
  bytes: 3,
  width: 30,
  height: 20,
  originalFilename: "upload",
};
let fixture: TestDatabase;
beforeAll(async () => {
  fixture = await createTestDatabase();
  effects.db = fixture.db;
});
beforeEach(async () => {
  await fixture.client.exec(
    'TRUNCATE "Media"; ALTER TABLE "Media" DROP CONSTRAINT IF EXISTS reject_upload',
  );
  vi.resetAllMocks();
  effects.session.mockResolvedValue({ user: { email: "owner@example.test" } });
  effects.upload.mockResolvedValue(remote);
  effects.destroy.mockResolvedValue(true);
  effects.blur.mockResolvedValue("data:image/webp;base64,fixture");
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());
afterAll(async () => {
  await fixture?.client.close();
});

function request() {
  const body = new FormData();
  body.set("file", new File(["png"], "upload.png", { type: "image/png" }));
  return new Request("https://example.test/api/upload", {
    method: "POST",
    body,
  });
}
async function rejectInsert() {
  await fixture.client.exec(
    `ALTER TABLE "Media" ADD CONSTRAINT reject_upload CHECK ("filename" <> 'upload.png')`,
  );
}

describe("upload compensation", () => {
  it.each([
    { width: 0, height: 0 },
    { width: undefined, height: undefined },
    { width: 0, height: 20 },
  ])(
    "returns normalized saved metadata for provider dimensions %j",
    async (dimensions) => {
      effects.upload.mockResolvedValue({ ...remote, ...dimensions });
      const response = await POST(request());
      expect(response.status).toBe(200);
      const body = await response.json();
      const stored = await fixture.db.query.media.findFirst();
      expect(body).toMatchObject({
        id: stored?.id,
        width: stored?.width,
        height: stored?.height,
        aspectRatio: stored?.aspectRatio,
      });
      expect(effects.destroy).not.toHaveBeenCalled();
    },
  );
  it("cleans up a completed remote upload when the DB insert fails", async () => {
    await rejectInsert();
    const response = await POST(request());
    expect(response.status).toBe(500);
    expect(effects.destroy).toHaveBeenCalledExactlyOnceWith(remote.publicId);
    expect(await fixture.db.query.media.findMany()).toEqual([]);
    expect(effects.revalidate).not.toHaveBeenCalled();
  });

  it.each([false, new Error("credential=private")])(
    "reports actionable reconciliation when cleanup fails (%s)",
    async (outcome) => {
      await rejectInsert();
      if (outcome instanceof Error) effects.destroy.mockRejectedValue(outcome);
      else effects.destroy.mockResolvedValue(outcome);
      const response = await POST(request());
      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body).toMatchObject({
        error: expect.stringMatching(/cleanup.*failed.*media\/upload/i),
      });
      expect(JSON.stringify(body)).not.toContain("credential");
      expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain(
        "credential",
      );
      expect(effects.destroy).toHaveBeenCalledOnce();
    },
  );

  it("waits for remote success when parallel blur generation rejects and saves without blur", async () => {
    effects.blur.mockRejectedValue(new Error("blur failed"));
    effects.upload.mockImplementation(async () => {
      await new Promise<void>((resolve) => setImmediate(resolve));
      return remote;
    });
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(await fixture.db.query.media.findMany()).toMatchObject([
      { publicId: remote.publicId, blurDataUrl: null },
    ]);
    expect(effects.destroy).not.toHaveBeenCalled();
  });

  it("cleans up late remote success even when blur and DB insert both fail", async () => {
    await rejectInsert();
    effects.blur.mockRejectedValue(new Error("blur failed"));
    effects.upload.mockImplementation(async () => {
      await new Promise<void>((resolve) => setImmediate(resolve));
      return remote;
    });
    expect((await POST(request())).status).toBe(500);
    expect(effects.destroy).toHaveBeenCalledExactlyOnceWith(remote.publicId);
    expect(await fixture.db.query.media.findMany()).toEqual([]);
  });

  it("returns the saved media and never cleans up after revalidation fails", async () => {
    effects.revalidate.mockImplementation(() => {
      throw new Error("cache secret");
    });
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      publicId: remote.publicId,
      filename: "upload.png",
    });
    expect(await fixture.db.query.media.findMany()).toHaveLength(1);
    expect(effects.destroy).not.toHaveBeenCalled();
  });

  it("does not attempt cleanup when upload itself fails or log provider secrets", async () => {
    effects.upload.mockRejectedValue(new Error("credential=private"));
    const response = await POST(request());
    expect(response.status).toBe(500);
    expect(effects.destroy).not.toHaveBeenCalled();
    expect(await fixture.db.query.media.findMany()).toEqual([]);
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain(
      "credential",
    );
  });

  it.each([null, { user: { email: "other@example.test" } }])(
    "authenticates before reading the body or making external calls (%s)",
    async (session) => {
      effects.session.mockResolvedValue(session);
      const req = request();
      const formData = vi.spyOn(req, "formData");
      const insert = vi.spyOn(fixture.db, "insert");
      expect((await POST(req)).status).toBe(401);
      expect(formData).not.toHaveBeenCalled();
      expect(insert).not.toHaveBeenCalled();
      expect(effects.upload).not.toHaveBeenCalled();
      expect(effects.destroy).not.toHaveBeenCalled();
    },
  );
});
