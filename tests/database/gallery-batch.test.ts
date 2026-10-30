import { revalidatePath, updateTag } from "next/cache";
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
  actionDeleteGalleryItems,
  actionHideGalleryItems,
  actionShowGalleryItems,
} from "@/features/dashboard/gallery/actions";
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
afterAll(async () => fixture.client.close());
beforeEach(async () => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  mocks.session.mockResolvedValue({ user: { id: "owner" } });
  await fixture.db.delete(galleryItem);
  await fixture.db.insert(galleryItem).values([
    {
      id: "visible",
      imageUrl: "https://example.test/a.jpg",
      category: "Photo",
      isVisible: true,
      order: 4,
    },
    {
      id: "hidden",
      imageUrl: "https://example.test/b.jpg",
      category: "Photo",
      isVisible: false,
      order: 8,
    },
    {
      id: "unselected",
      imageUrl: "https://example.test/c.jpg",
      category: "Other",
      isVisible: true,
      order: 12,
    },
  ]);
});

const states = async () =>
  (await fixture.db.query.galleryItem.findMany())
    .map(({ id, isVisible, order }) => ({ id, isVisible, order }))
    .sort((a, b) => a.id.localeCompare(b.id));

const overLimitIds = () => [
  "visible",
  "hidden",
  ...Array.from({ length: 99 }, (_, index) => `missing-${index}`),
];

describe.each([
  { name: "show", action: actionShowGalleryItems, isVisible: true },
  { name: "hide", action: actionHideGalleryItems, isVisible: false },
  { name: "delete", action: actionDeleteGalleryItems, isVisible: undefined },
])("gallery batch $name", ({ name, action, isVisible }) => {
  it.each([
    { label: "valid", ids: ["visible", "hidden"] },
    { label: "empty", ids: [] },
    { label: "malformed", ids: [""] },
    { label: "over limit", ids: overLimitIds() },
  ])("checks authorization before $label input validation", async ({ ids }) => {
    mocks.session.mockRejectedValueOnce(new Error("Unauthorized"));
    const before = await states();
    const update = vi.spyOn(fixture.db, "update");
    const remove = vi.spyOn(fixture.db, "delete");
    expect(await action(ids)).toMatchObject({
      success: false,
      error: "Unauthorized",
    });
    expect(await states()).toEqual(before);
    expect(update).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
    expect(updateTag).not.toHaveBeenCalled();
  });

  it("rejects over 100 IDs with a helpful limit message and no writes", async () => {
    const before = await states();
    const update = vi.spyOn(fixture.db, "update");
    const remove = vi.spyOn(fixture.db, "delete");
    const result = await action(overLimitIds());
    expect(await states()).toEqual(before);
    expect(update).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
    expect(updateTag).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      success: false,
      error: "Select no more than 100 gallery items at a time.",
    });
  });

  it.each([{ ids: [] }, { ids: [""] }])(
    "keeps the selection error for empty or malformed IDs %#",
    async ({ ids }) => {
      const before = await states();
      expect(await action(ids)).toMatchObject({
        success: false,
        error: "Select at least one gallery item.",
      });
      expect(await states()).toEqual(before);
    },
  );

  it.each([
    {
      label: "duplicates and stale IDs",
      ids: ["visible", "hidden", "hidden", "missing"],
    },
    { label: "exactly 100 IDs", ids: overLimitIds().slice(0, 100) },
  ])("preserves affected counts and order for $label", async ({ ids }) => {
    expect(await action(ids)).toMatchObject({
      success: true,
      data: { count: name === "delete" ? 2 : 1 },
    });
    expect(await states()).toEqual(
      [
        ...(isVisible === undefined
          ? []
          : [
              { id: "hidden", isVisible, order: 8 },
              { id: "visible", isVisible, order: 4 },
            ]),
        { id: "unselected", isVisible: true, order: 12 },
      ].sort((a, b) => a.id.localeCompare(b.id)),
    );
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard/gallery");
    expect(updateTag).toHaveBeenCalled();
  });
});
