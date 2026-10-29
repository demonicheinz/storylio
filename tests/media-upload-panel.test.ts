import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { MediaUploadPanel } from "@/features/dashboard/media/components/media-upload-queue";
import {
  createMediaUploadQueue,
  type useMediaUploadQueue,
} from "@/features/dashboard/media/use-media-upload-queue";

function render(
  status: "uploading" | "processing" | "success" | "error",
  progress?: number,
) {
  const queue = createMediaUploadQueue(vi.fn());
  const state: ReturnType<typeof useMediaUploadQueue> = {
    ...queue.getSnapshot(),
    ...queue,
    busy: status === "uploading" || status === "processing",
    items: [
      {
        id: "row-1",
        file: new File(["data"], "photo.png", { type: "image/png" }),
        previewUrl: "blob:photo",
        status,
        progress,
        error:
          status === "error"
            ? "Connection lost. Check the library before retrying."
            : undefined,
        response:
          status === "success"
            ? {
                id: "saved-id",
                url: "https://example.test/photo.png",
                publicId: "photo",
                filename: "photo.png",
                size: 4,
                format: "png",
                width: null,
                height: null,
                aspectRatio: null,
                blurDataUrl: null,
              }
            : undefined,
      },
    ],
  };
  return renderToStaticMarkup(
    createElement(MediaUploadPanel, {
      queue: state,
      onBrowse: vi.fn(),
      onClose: vi.fn(),
      onViewMedia: vi.fn(),
      dragging: false,
    }),
  );
}

describe("media upload panel semantics", () => {
  it("labels measured progress and disables close while busy", () => {
    const html = render("uploading", 23);
    expect(html).toContain('aria-valuenow="23"');
    expect(html).toContain("4 B");
    expect(html).toContain('aria-label="Upload progress for photo.png"');
    expect(html).toMatch(
      /<button[^>]*disabled=""[^>]*aria-label="Close upload queue"/,
    );
    expect(html).not.toContain('aria-label="Remove photo.png"');
    expect(html).toContain("Browse files");
    expect(html).not.toContain('type="file"');
  });
  it("does not invent percentages during unknown transfer or processing", () => {
    expect(render("uploading")).not.toContain('role="progressbar"');
    const html = render("processing", 100);
    expect(html).toContain("Processing");
    expect(html).not.toContain('role="progressbar"');
    expect(html).not.toContain("100%");
  });
  it("offers viewing completed media and keeps retry actions for failures", () => {
    const success = render("success");
    expect(success).toContain('aria-label="View image photo.png"');
    expect(success).not.toContain('aria-label="Retry photo.png"');
    const failed = render("error");
    expect(failed).toContain('aria-label="Retry photo.png"');
    expect(failed).toContain('aria-label="Remove photo.png"');
    expect(failed).toContain("Retry failed");
  });
});
