import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MediaItem } from "@/features/dashboard/media/types";
import { useMediaDeletion } from "@/features/dashboard/media/use-media-deletion";

const mocks = vi.hoisted(() => ({
  usage: vi.fn(),
  single: vi.fn(),
  batch: vi.fn(),
  toast: vi.fn(),
}));
const hooks = vi.hoisted(() => ({
  values: [] as unknown[],
  index: 0,
  tasks: [] as Promise<unknown>[],
}));
vi.mock("@/features/dashboard/media/actions", () => ({
  actionCheckMediaUsage: mocks.usage,
  actionDeleteMedia: mocks.single,
  actionDeleteMediaBatch: mocks.batch,
}));
vi.mock("@/components/ui/toast", () => ({ toast: { add: mocks.toast } }));
// Call the real controller with retained state/refs; browser tests verify React transitions.
vi.mock("react", async (original) => ({
  ...(await original<typeof import("react")>()),
  useState(initial: unknown) {
    const index = hooks.index++;
    if (!(index in hooks.values)) hooks.values[index] = initial;
    return [
      hooks.values[index],
      (next: unknown) => {
        hooks.values[index] =
          typeof next === "function" ? next(hooks.values[index]) : next;
      },
    ];
  },
  useRef(initial: unknown) {
    const index = hooks.index++;
    if (!(index in hooks.values)) hooks.values[index] = { current: initial };
    return hooks.values[index];
  },
  useTransition: () => [
    false,
    (task: () => Promise<void>) => hooks.tasks.push(task()),
  ],
}));

const media: MediaItem[] = ["a", "b", "protected"].map((id) => ({
  id,
  filename: `${id}.png`,
  url: `/${id}.png`,
  publicId: id,
  size: 10,
  format: "png",
  width: null,
  height: null,
  aspectRatio: null,
  blurDataUrl: null,
  createdAt: "2026-10-30T00:00:00Z",
}));
const usage = {
  canDelete: media.slice(0, 2).map((item) => ({ ...item, references: [] })),
  blocked: [{ ...media[2], references: [{ label: "post cover", count: 1 }] }],
};
const onDeleted = vi.fn();
const onBatchComplete = vi.fn();
const render = (selectedItems = media) => {
  hooks.index = 0;
  return useMediaDeletion({ media, selectedItems, onDeleted, onBatchComplete });
};
const flush = () => Promise.all(hooks.tasks);

beforeEach(() => {
  vi.resetAllMocks();
  hooks.values = [];
  hooks.index = 0;
  hooks.tasks = [];
  mocks.usage.mockResolvedValue({ success: true, data: usage });
});
afterEach(() => vi.unstubAllGlobals());

describe("media deletion controller", () => {
  it("locks single deletion synchronously and retains its target after failure", async () => {
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    render().requestDelete(media[0]);
    let release!: (value: unknown) => void;
    mocks.single.mockReturnValueOnce(
      new Promise((resolve) => {
        release = resolve;
      }),
    );
    const controller = render();
    controller.confirmSingle();
    controller.confirmSingle();
    expect(mocks.single).toHaveBeenCalledTimes(1);
    expect(controller.closeSingle()).toBe(false);
    release({ success: false, error: "Still in use" });
    await flush();
    expect(render().deleteTarget?.id).toBe("a");
    expect(render().actionError).toBe("Still in use");
    expect(onDeleted).not.toHaveBeenCalled();
    mocks.single.mockResolvedValueOnce({ success: true });
    render().confirmSingle();
    await flush();
    expect(onDeleted).toHaveBeenCalledWith(["a"]);
    expect(render().deleteTarget).toBeNull();
  });
  it("ignores an empty review and locks duplicate usage calls before rerender", async () => {
    render([]).checkUsage();
    expect(mocks.usage).not.toHaveBeenCalled();
    let release!: (value: unknown) => void;
    mocks.usage.mockReturnValue(
      new Promise((resolve) => {
        release = resolve;
      }),
    );
    const controller = render();
    controller.checkUsage();
    controller.checkUsage();
    expect(mocks.usage).toHaveBeenCalledTimes(1);
    expect(controller.isLocked()).toBe(true);
    expect(controller.closeBatch()).toBe(false);
    release({ success: true, data: usage });
    await flush();
    expect(render().batchPreview).toEqual(usage);
    expect(render().isLocked()).toBe(false);
  });
  it("releases the lock after failed review and permits a retry", async () => {
    mocks.usage.mockRejectedValueOnce(new Error("Offline"));
    render().checkUsage();
    await flush();
    expect(render().batchOpen).toBe(false);
    expect(render().isLocked()).toBe(false);
    expect(mocks.toast).toHaveBeenCalledWith(
      expect.objectContaining({ type: "error" }),
    );
    render().checkUsage();
    await flush();
    expect(render().batchOpen).toBe(true);
  });
  it("only reconciles confirmed deletions and retries failed rows without protected items", async () => {
    render().checkUsage();
    await flush();
    mocks.batch.mockResolvedValueOnce({
      success: true,
      data: {
        deletedIds: ["a"],
        failedItems: [
          { id: "b", filename: "b.png", error: "Provider unavailable" },
        ],
      },
    });
    render().confirmBatch();
    await flush();
    expect(mocks.batch).toHaveBeenLastCalledWith(["a", "b"]);
    expect(onDeleted).toHaveBeenLastCalledWith(["a"]);
    expect(render().batchPreview?.canDelete.map((item) => item.id)).toEqual([
      "b",
    ]);
    expect(render().batchPreview?.blocked).toEqual(usage.blocked);
    expect(onBatchComplete).not.toHaveBeenCalled();
    mocks.batch.mockResolvedValueOnce({
      success: true,
      data: { deletedIds: ["b"], failedItems: [] },
    });
    render().confirmBatch();
    await flush();
    expect(mocks.batch).toHaveBeenLastCalledWith(["b"]);
    expect(onBatchComplete).toHaveBeenCalledWith(["b"]);
    expect(render().batchOpen).toBe(false);
  });
  it("keeps batch preview on rejected deletion and blocks same-tick duplicate confirmations", async () => {
    render().checkUsage();
    await flush();
    mocks.batch.mockResolvedValueOnce({
      success: false,
      error: "Still in use",
    });
    const controller = render();
    controller.confirmBatch();
    controller.confirmBatch();
    expect(mocks.batch).toHaveBeenCalledTimes(1);
    await flush();
    expect(render().actionError).toBe("Still in use");
    expect(render().batchPreview).toEqual(usage);
    expect(onDeleted).not.toHaveBeenCalled();
    expect(render().isLocked()).toBe(false);
  });
});
