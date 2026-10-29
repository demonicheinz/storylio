import { describe, expect, it, vi } from "vitest";
import type { UploadTransportOptions } from "@/features/dashboard/media/upload-transport";
import { createMediaUploadQueue } from "@/features/dashboard/media/use-media-upload-queue";
import type { UploadResponse } from "@/features/dashboard/shared/utils/upload";

const response: UploadResponse = {
  id: "saved",
  url: "https://example.test/a.png",
  publicId: "a",
  filename: "a.png",
  size: 1,
  format: "png",
  width: null,
  height: null,
  aspectRatio: null,
  blurDataUrl: null,
};
const image = (name = "a.png", type = "image/png") =>
  new File(["a"], name, { type, lastModified: 1 });
const flush = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

function fixture() {
  const jobs: {
    file: File;
    options: UploadTransportOptions;
    resolve: (data: UploadResponse) => void;
    reject: (error: Error) => void;
  }[] = [];
  const onUploaded = vi.fn();
  const revokePreview = vi.fn();
  const transport = vi.fn(
    (file: File, options: UploadTransportOptions) =>
      new Promise<UploadResponse>((resolve, reject) => {
        jobs.push({ file, options, resolve, reject });
      }),
  );
  const queue = createMediaUploadQueue(onUploaded, {
    transport,
    createPreview: (file) => `blob:${file.name}`,
    revokePreview,
  });
  queue.activate();
  return { queue, jobs, onUploaded, revokePreview, transport };
}

describe("media upload queue controller", () => {
  it("drains ten files in pairs and bulk-retries failures without resending successes", async () => {
    const { queue, jobs, onUploaded } = fixture();
    queue.addFiles(Array.from({ length: 10 }, (_, i) => image(`${i}.png`)));
    for (let i = 0; i < 10; i += 2) {
      expect(jobs).toHaveLength(i + 2);
      jobs[i].resolve({ ...response, id: `saved-${i}` });
      jobs[i + 1].reject(new Error("offline"));
      await flush();
      expect(
        queue.getSnapshot().items.filter((item) => item.status === "uploading")
          .length,
      ).toBeLessThanOrEqual(2);
    }
    expect(queue.getSnapshot().busy).toBe(false);
    expect(onUploaded).toHaveBeenCalledTimes(5);
    queue.retryFailed();
    queue.retryFailed();
    expect(jobs).toHaveLength(12);
    for (let i = 10; i < 15; i++) {
      expect(Number.parseInt(jobs[i].file.name, 10) % 2).toBe(1);
      jobs[i].resolve({ ...response, id: `retry-${i}` });
      await flush();
    }
    expect(jobs).toHaveLength(15);
    expect(onUploaded).toHaveBeenCalledTimes(10);
    expect(
      queue.getSnapshot().items.every((item) => item.status === "success"),
    ).toBe(true);
    expect(queue.getSnapshot().busy).toBe(false);
  });

  it("aborts active work, revokes queued previews too, and starts nothing after unmount", async () => {
    const { queue, jobs, revokePreview, onUploaded } = fixture();
    queue.addFiles([image("1.png"), image("2.png"), image("3.png")]);
    queue.deactivate();
    queue.deactivate();
    expect(jobs.every((job) => job.options.signal.aborted)).toBe(true);
    expect(revokePreview).toHaveBeenCalledTimes(3);
    jobs[0].reject(new Error("late failure"));
    jobs[1].resolve(response);
    await flush();
    queue.retryFailed();
    queue.addFiles([image("4.png")]);
    expect(jobs).toHaveLength(2);
    expect(onUploaded).not.toHaveBeenCalled();
  });

  it("runs at most two jobs, accepts appends while busy, and keeps stable ids", async () => {
    const { queue, jobs } = fixture();
    queue.addFiles([image("1.png"), image("2.png"), image("3.png")]);
    const ids = queue.getSnapshot().items.map((item) => item.id);
    expect(jobs).toHaveLength(2);
    expect(queue.getSnapshot().busy).toBe(true);
    queue.addFiles([image("4.png")]);
    expect(jobs).toHaveLength(2);
    jobs[0].options.onProcessing?.();
    expect(queue.getSnapshot().items[0].status).toBe("processing");
    expect(queue.getSnapshot().busy).toBe(true);
    expect(jobs).toHaveLength(2);
    jobs[0].resolve(response);
    await flush();
    expect(jobs).toHaveLength(3);
    expect(
      queue
        .getSnapshot()
        .items.slice(0, 3)
        .map((item) => item.id),
    ).toEqual(ids);
    expect(queue.getSnapshot().items[0].response).toEqual(response);
  });

  it("retries only failed files; clear completed keeps failures", async () => {
    const { queue, jobs, onUploaded } = fixture();
    queue.addFiles([image("good.png"), image("failed.png")]);
    const [good, failed] = queue.getSnapshot().items;
    jobs[0].resolve(response);
    jobs[1].reject(new Error("offline"));
    await flush();
    expect(queue.getSnapshot().busy).toBe(false);
    queue.retry(good.id);
    expect(jobs).toHaveLength(2);
    queue.retry(failed.id);
    queue.retryFailed();
    expect(jobs).toHaveLength(3);
    expect(jobs[2].file.name).toBe("failed.png");
    jobs[2].reject(new Error("offline again"));
    await flush();
    queue.clearCompleted();
    expect(queue.getSnapshot().items.map((item) => item.id)).toEqual([
      failed.id,
    ]);
    expect(onUploaded).toHaveBeenCalledOnce();
  });

  it("retains per-file validation failures and explains capacity and duplicate rejections", () => {
    const { queue, jobs } = fixture();
    const big = image("large.jpg", "image/jpeg");
    Object.defineProperty(big, "size", { value: 10 * 1024 * 1024 + 1 });
    const file = image();
    queue.addFiles([image("bad.svg", "image/svg+xml"), big, file, file]);
    expect(queue.getSnapshot().items).toHaveLength(3);
    expect(queue.getSnapshot().items[0].error).toMatch(
      /JPEG, PNG, WebP, or GIF/,
    );
    expect(queue.getSnapshot().items[1].error).toMatch(/10 MB/);
    queue.retryFailed();
    expect(jobs).toHaveLength(1);
    queue.addFiles(Array.from({ length: 9 }, (_, i) => image(`${i}.png`)));
    expect(queue.getSnapshot().items).toHaveLength(10);
    expect(queue.getSnapshot().rejections.map((item) => item.filename)).toEqual(
      ["7.png", "8.png"],
    );
  });

  it("accepts all allowed formats and the exact 10 MB boundary", () => {
    const { queue } = fixture();
    const files = ["image/jpeg", "image/png", "image/webp", "image/gif"].map(
      (type) => image(type, type),
    );
    Object.defineProperty(files[0], "size", { value: 10 * 1024 * 1024 });
    queue.addFiles(files);
    expect(
      queue.getSnapshot().items.every((item) => item.status !== "error"),
    ).toBe(true);
  });

  it("removes only nonactive rows and revokes their previews", async () => {
    const { queue, jobs, revokePreview } = fixture();
    queue.addFiles([image("1.png"), image("2.png"), image("3.png")]);
    const [active, , queued] = queue.getSnapshot().items;
    queue.remove(active.id);
    expect(queue.getSnapshot().items).toHaveLength(3);
    jobs[0].options.onProcessing?.();
    queue.remove(active.id);
    expect(queue.getSnapshot().items).toHaveLength(3);
    queue.remove(queued.id);
    expect(revokePreview).toHaveBeenCalledWith("blob:3.png");
    jobs[0].resolve(response);
    await flush();
    queue.clearCompleted();
    expect(revokePreview).toHaveBeenCalledWith("blob:1.png");
  });

  it("aborts on cleanup, revokes every preview, and ignores late callbacks across StrictMode setup", async () => {
    const { queue, jobs, revokePreview, onUploaded } = fixture();
    queue.deactivate();
    queue.activate();
    queue.activate();
    const files = [image("1.png"), image("2.png")];
    queue.addFiles(files);
    const old = jobs[0];
    queue.deactivate();
    queue.activate();
    queue.addFiles(files);
    expect(jobs).toHaveLength(2);
    expect(old.options.signal.aborted).toBe(true);
    expect(revokePreview).toHaveBeenCalledTimes(2);
    old.options.onProgress?.(99);
    old.options.onProcessing?.();
    old.resolve(response);
    await flush();
    expect(onUploaded).not.toHaveBeenCalled();
    expect(queue.getSnapshot().items[0].status).toBe("error");
    expect(queue.getSnapshot().items[0].error).toMatch(
      /may already have been saved/,
    );
    queue.retry(queue.getSnapshot().items[0].id);
    expect(jobs).toHaveLength(3);
    jobs[2].resolve(response);
    await flush();
    expect(onUploaded).toHaveBeenCalledOnce();
  });

  it("never invents progress or updates completed rows with late transfer events", async () => {
    const { queue, jobs } = fixture();
    queue.addFiles([image()]);
    expect(queue.getSnapshot().items[0].progress).toBeUndefined();
    jobs[0].options.onProgress?.(37);
    expect(queue.getSnapshot().items[0].progress).toBe(37);
    jobs[0].options.onProcessing?.();
    jobs[0].options.onProgress?.(90);
    expect(queue.getSnapshot().items[0].progress).toBe(37);
    jobs[0].resolve(response);
    await flush();
    jobs[0].options.onProcessing?.();
    expect(queue.getSnapshot().items[0].status).toBe("success");
  });
});
