import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { actionPublishProjects } from "@/features/dashboard/projects/actions";
import { ProjectStatus } from "@/lib/db/enums";
import { project, user } from "@/lib/db/schema";
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
  await fixture.db
    .insert(user)
    .values({ id: "owner", email: "owner@example.test" });
});
afterAll(async () => fixture.client.close());
beforeEach(async () => {
  mocks.session.mockResolvedValue({ user: { id: "owner" } });
  await fixture.db.delete(project);
  await fixture.db.insert(project).values(
    [
      {
        id: "ready",
        title: "Ready project",
        slug: "ready",
        content: "Ready to publish.",
        status: ProjectStatus.DRAFT,
      },
      {
        id: "empty",
        title: "Empty project",
        slug: "empty",
        content: "",
        status: ProjectStatus.DRAFT,
      },
      {
        id: "unsafe",
        title: "Unsafe project",
        slug: "unsafe",
        content: "{process.env.SECRET}",
        status: ProjectStatus.DRAFT,
      },
    ].map((row) => ({ ...row, authorId: "owner" })),
  );
});
const states = async () =>
  (await fixture.db.query.project.findMany())
    .map(({ id, status }) => ({ id, status }))
    .sort((a, b) => a.id.localeCompare(b.id));
describe("batch project publication", () => {
  it.each([
    "empty",
    "unsafe",
    "missing",
  ])("rejects %s atomically", async (id) => {
    const before = await states();
    expect((await actionPublishProjects(["ready", id])).success).toBe(false);
    expect(await states()).toEqual(before);
  });
  it("publishes valid projects", async () => {
    expect(await actionPublishProjects(["ready"])).toMatchObject({
      success: true,
      data: { count: 1 },
    });
    expect((await states()).find((r) => r.id === "ready")?.status).toBe(
      ProjectStatus.PUBLISHED,
    );
  });
  it("requires authentication without modifying valid projects", async () => {
    mocks.session.mockRejectedValueOnce(new Error("Unauthorized"));
    const before = await states();
    expect(await actionPublishProjects(["ready"])).toMatchObject({
      success: false,
      error: "Unauthorized",
    });
    expect(await states()).toEqual(before);
  });
});
