import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { actionReorderGalleryItems } from "@/features/dashboard/gallery/actions";
import { galleryItem } from "@/lib/db/schema";
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
  await fixture.db.delete(galleryItem);
  await fixture.db.insert(galleryItem).values([
    {
      id: "visible",
      imageUrl: "https://example.test/a.jpg",
      category: "Photo",
      order: 0,
    },
    {
      id: "hidden",
      imageUrl: "https://example.test/b.jpg",
      category: "Photo",
      isVisible: false,
      order: 1,
    },
    {
      id: "other-page",
      imageUrl: "https://example.test/c.jpg",
      category: "Other",
      order: 2,
    },
  ]);
});
const orders = async () =>
  (await fixture.db.query.galleryItem.findMany())
    .map(({ id, order }) => ({ id, order }))
    .sort((a, b) => a.id.localeCompare(b.id));

describe("gallery collection reorder", () => {
  it("rejects filtered and paginated subsets without changing any positions", async () => {
    const before = await orders();
    const result = await actionReorderGalleryItems([
      { id: "other-page", order: 0 },
      { id: "visible", order: 1 },
    ]);
    expect(result.success).toBe(false);
    expect(await orders()).toEqual(before);
  });
  it.each(
    [
      [],
      [
        { id: "visible", order: 0 },
        { id: "visible", order: 1 },
        { id: "other-page", order: 2 },
      ],
      [
        { id: "visible", order: 0 },
        { id: "hidden", order: 0 },
        { id: "other-page", order: 2 },
      ],
      [
        { id: "visible", order: 0 },
        { id: "hidden", order: 1 },
        { id: "other-page", order: 5 },
      ],
      [
        { id: "visible", order: 0 },
        { id: "hidden", order: 1 },
        { id: "deleted", order: 2 },
      ],
    ].map((input) => ({ input })),
  )("rejects invalid or stale order %# atomically", async ({ input }) => {
    const before = await orders();
    expect((await actionReorderGalleryItems(input)).success).toBe(false);
    expect(await orders()).toEqual(before);
  });
  it("includes hidden items when saving the complete collection", async () => {
    const result = await actionReorderGalleryItems([
      { id: "other-page", order: 0 },
      { id: "hidden", order: 1 },
      { id: "visible", order: 2 },
    ]);
    expect(result.success).toBe(true);
    expect(await orders()).toEqual([
      { id: "hidden", order: 1 },
      { id: "other-page", order: 0 },
      { id: "visible", order: 2 },
    ]);
  });
  it("requires an authenticated session", async () => {
    mocks.session.mockRejectedValueOnce(new Error("Unauthorized"));
    const before = await orders();
    const result = await actionReorderGalleryItems([
      { id: "other-page", order: 0 },
      { id: "hidden", order: 1 },
      { id: "visible", order: 2 },
    ]);
    expect(result).toMatchObject({ success: false, error: "Unauthorized" });
    expect(await orders()).toEqual(before);
  });
  it("rejects a snapshot taken before another item joined the collection", async () => {
    await fixture.db.insert(galleryItem).values({
      id: "new-item",
      imageUrl: "https://example.test/new.jpg",
      category: "Photo",
      order: 3,
    });
    const before = await orders();
    const result = await actionReorderGalleryItems([
      { id: "other-page", order: 0 },
      { id: "hidden", order: 1 },
      { id: "visible", order: 2 },
    ]);
    expect(result.success).toBe(false);
    expect(await orders()).toEqual(before);
  });
});
