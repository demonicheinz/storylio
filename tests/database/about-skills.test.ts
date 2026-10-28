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
  actionReorderSkills,
  actionUpdateSkill,
} from "@/features/dashboard/about/structured-actions";
import { skill, skillCategory } from "@/lib/db/schema";
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
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), updateTag: vi.fn() }));
let fixture: Awaited<ReturnType<typeof createTestDatabase>>;
beforeAll(async () => {
  fixture = await createTestDatabase();
  mocks.db = fixture.db;
});
afterAll(async () => {
  await fixture.client.close();
});
beforeEach(async () => {
  mocks.session.mockResolvedValue({ user: { id: "owner" } });
  await fixture.db.delete(skill);
  await fixture.db.delete(skillCategory);
  await fixture.db.insert(skillCategory).values([
    { id: "a", name: "Frontend" },
    { id: "b", name: "Backend" },
  ]);
  await fixture.db.insert(skill).values([
    { id: "a1", categoryId: "a", name: "React", order: 0 },
    { id: "a2", categoryId: "a", name: "CSS", order: 1 },
    { id: "b1", categoryId: "b", name: "SQL", order: 0 },
  ]);
});
const rows = async () =>
  (await fixture.db.query.skill.findMany())
    .map(({ id, order, categoryId }) => ({ id, order, categoryId }))
    .sort((a, b) => a.id.localeCompare(b.id));

describe("About category-scoped skills", () => {
  it("reorders the entire category without touching another category", async () => {
    expect(
      (
        await actionReorderSkills(
          [
            { id: "a2", order: 0 },
            { id: "a1", order: 1 },
          ],
          "a",
        )
      ).success,
    ).toBe(true);
    expect(await rows()).toEqual([
      { id: "a1", order: 1, categoryId: "a" },
      { id: "a2", order: 0, categoryId: "a" },
      { id: "b1", order: 0, categoryId: "b" },
    ]);
  });
  it.each([
    [],
    [{ id: "a1", order: 0 }],
    [
      { id: "a1", order: 0 },
      { id: "b1", order: 1 },
    ],
    [
      { id: "a1", order: 0 },
      { id: "a1", order: 1 },
    ],
    [
      { id: "a1", order: 0 },
      { id: "a2", order: 4 },
    ],
  ])("rejects incomplete, mixed, duplicate or invalid orders %#", async (...entries) => {
    const before = await rows();
    expect((await actionReorderSkills(entries, "a")).success).toBe(false);
    expect(await rows()).toEqual(before);
  });
  it("requires authorization for an otherwise valid reorder", async () => {
    mocks.session.mockRejectedValueOnce(new Error("Unauthorized"));
    const before = await rows();
    expect(
      await actionReorderSkills(
        [
          { id: "a2", order: 0 },
          { id: "a1", order: 1 },
        ],
        "a",
      ),
    ).toMatchObject({ success: false, error: "Unauthorized" });
    expect(await rows()).toEqual(before);
  });
  it("appends reassigned skills to the selected category", async () => {
    expect(
      (
        await actionUpdateSkill("a2", {
          name: "CSS",
          categoryId: "b",
          order: 99,
        })
      ).success,
    ).toBe(true);
    expect((await rows()).find((r) => r.id === "a2")).toEqual({
      id: "a2",
      categoryId: "b",
      order: 1,
    });
  });
});
