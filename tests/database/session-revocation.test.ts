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
  actionListDashboardSessions,
  actionRevokeDashboardSession,
} from "@/features/dashboard/settings/actions";
import * as schema from "@/lib/db/schema";
import { createTestDatabase } from "../helpers/database";

const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  db: undefined as
    | Awaited<ReturnType<typeof createTestDatabase>>["db"]
    | undefined,
}));
vi.mock("@/lib/auth-session", () => ({ getActionSession: mocks.session }));
vi.mock("@/lib/db", () => ({
  get db() {
    return mocks.db;
  },
}));
vi.mock("@/lib/auth", () => ({ auth: { api: {} } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), updateTag: vi.fn() }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
let fixture: Awaited<ReturnType<typeof createTestDatabase>>;
beforeAll(async () => {
  fixture = await createTestDatabase();
  mocks.db = fixture.db;
});
beforeEach(async () => {
  await fixture.db.delete(schema.user);
  await fixture.db.insert(schema.user).values([
    { id: "owner", email: "owner@example.test" },
    { id: "other", email: "other@example.test" },
  ]);
  await fixture.db.insert(schema.session).values([
    {
      id: "current",
      userId: "owner",
      token: "current-token",
      expiresAt: new Date(Date.now() + 3600_000),
    },
    {
      id: "target",
      userId: "owner",
      token: "target-token",
      expiresAt: new Date(Date.now() + 3600_000),
    },
    {
      id: "foreign",
      userId: "other",
      token: "foreign-token",
      expiresAt: new Date(Date.now() + 3600_000),
    },
    {
      id: "expired",
      userId: "owner",
      token: "expired-token",
      expiresAt: new Date(Date.now() - 3600_000),
    },
  ]);
  mocks.session.mockResolvedValue({
    user: { id: "owner" },
    session: { token: "current-token" },
  });
});
afterAll(async () => {
  await fixture.client.close();
});
describe("individual session revocation", () => {
  it("lists only live owned sessions without exposing bearer tokens", async () => {
    const result = await actionListDashboardSessions();
    expect(result.success).toBe(true);
    if (!result.success) throw new Error(result.error);
    expect(result.data?.map((item) => item.id).sort()).toEqual([
      "current",
      "target",
    ]);
    expect(JSON.stringify(result)).not.toContain("token");
  });
  it("removes the selected owned session and retains current and foreign sessions", async () => {
    expect((await actionRevokeDashboardSession("target")).success).toBe(true);
    expect(
      (await fixture.db.query.session.findMany()).map((item) => item.id).sort(),
    ).toEqual(["current", "expired", "foreign"]);
  });
  it("rejects foreign, current, unknown, and malformed IDs", async () => {
    for (const id of ["current", "foreign", "missing", ""])
      expect((await actionRevokeDashboardSession(id)).success).toBe(false);
    expect(await fixture.db.query.session.findMany()).toHaveLength(4);
  });
  it("requires an authenticated owner", async () => {
    mocks.session.mockRejectedValueOnce(new Error("Unauthorized"));
    expect(await actionRevokeDashboardSession("target")).toMatchObject({
      success: false,
      error: "Unauthorized",
    });
    expect(await fixture.db.query.session.findMany()).toHaveLength(4);
  });
});
