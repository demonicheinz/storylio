import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { uploadMedia } from "@/features/dashboard/media/upload-transport";

const uploaded = {
  id: "media-1",
  url: "https://images.example.test/image.png",
  publicId: "image",
  filename: "image.png",
  size: 4,
  format: "png",
  width: 2,
  height: 2,
  aspectRatio: 1,
  blurDataUrl: null,
};

class FakeXHR extends EventTarget {
  static instances: FakeXHR[] = [];
  upload = new EventTarget();
  status = 200;
  responseText = JSON.stringify(uploaded);
  timeout = 0;
  open = vi.fn();
  send = vi.fn();
  abort = vi.fn(() => this.dispatchEvent(new Event("abort")));
  constructor() {
    super();
    FakeXHR.instances.push(this);
  }
}

describe("media upload transport", () => {
  beforeEach(() => {
    FakeXHR.instances = [];
    vi.stubGlobal("XMLHttpRequest", FakeXHR);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("does not send an already-aborted request", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      uploadMedia(new File([], "image.png"), { signal: controller.signal }),
    ).rejects.toThrow(/may already have been saved/);
    expect(FakeXHR.instances[0].send).not.toHaveBeenCalled();
  });

  it("accepts a valid 201 and detaches callbacks after settlement", async () => {
    const onProgress = vi.fn();
    const onProcessing = vi.fn();
    const promise = uploadMedia(new File([], "image.png"), {
      signal: new AbortController().signal,
      onProgress,
      onProcessing,
    });
    const xhr = FakeXHR.instances[0];
    expect(xhr.timeout).toBe(120_000);
    xhr.status = 201;
    xhr.dispatchEvent(new Event("load"));
    await expect(promise).resolves.toEqual(uploaded);
    xhr.dispatchEvent(new Event("error"));
    xhr.upload.dispatchEvent(new Event("load"));
    xhr.upload.dispatchEvent(new Event("progress"));
    expect(onProgress).not.toHaveBeenCalled();
    expect(onProcessing).not.toHaveBeenCalled();
  });

  it("posts a file and reports only measured transfer progress before processing", async () => {
    const onProgress = vi.fn();
    const onProcessing = vi.fn();
    const promise = uploadMedia(new File(["data"], "image.png"), {
      signal: new AbortController().signal,
      onProgress,
      onProcessing,
    });
    const xhr = FakeXHR.instances[0];
    expect(xhr.open).toHaveBeenCalledWith("POST", "/api/upload");
    expect(
      (xhr.send.mock.calls[0] as unknown as [FormData])[0].get("file"),
    ).toBeInstanceOf(File);
    expect(onProgress).not.toHaveBeenCalled();
    const progress = Object.assign(new Event("progress"), {
      lengthComputable: true,
      loaded: 1,
      total: 4,
    });
    xhr.upload.dispatchEvent(progress);
    expect(onProgress).toHaveBeenLastCalledWith(25);
    xhr.upload.dispatchEvent(
      Object.assign(new Event("progress"), {
        lengthComputable: false,
        loaded: 2,
        total: 0,
      }),
    );
    expect(onProgress).toHaveBeenLastCalledWith(undefined);
    xhr.upload.dispatchEvent(new Event("load"));
    expect(onProcessing).toHaveBeenCalledOnce();
    xhr.dispatchEvent(new Event("load"));
    await expect(promise).resolves.toEqual(uploaded);
  });

  it.each([400, 401, 413, 429, 500])(
    "rejects HTTP %s even with a valid-looking body",
    async (status) => {
      const promise = uploadMedia(new File([], "image.png"), {
        signal: new AbortController().signal,
      });
      const xhr = FakeXHR.instances[0];
      xhr.status = status;
      xhr.dispatchEvent(new Event("load"));
      await expect(promise).rejects.toThrow(`HTTP ${status}`);
    },
  );

  it.each([
    "not json",
    "{}",
    JSON.stringify({ ...uploaded, id: "" }),
    JSON.stringify({ ...uploaded, width: "2" }),
    JSON.stringify({ ...uploaded, url: "javascript:alert(1)" }),
  ])("rejects invalid success responses: %s", async (body) => {
    const promise = uploadMedia(new File([], "image.png"), {
      signal: new AbortController().signal,
    });
    const xhr = FakeXHR.instances[0];
    xhr.responseText = body;
    xhr.dispatchEvent(new Event("load"));
    await expect(promise).rejects.toThrow(/could not confirm/i);
  });

  it.each(["error", "timeout", "abort"])(
    "does not claim rollback on %s",
    async (event) => {
      const promise = uploadMedia(new File([], "image.png"), {
        signal: new AbortController().signal,
      });
      FakeXHR.instances[0].dispatchEvent(new Event(event));
      await expect(promise).rejects.toThrow(/may already have been saved/i);
    },
  );

  it("aborts the XHR and ignores late events", async () => {
    const abort = new AbortController();
    const onProcessing = vi.fn();
    const promise = uploadMedia(new File([], "image.png"), {
      signal: abort.signal,
      onProcessing,
    });
    const xhr = FakeXHR.instances[0];
    abort.abort();
    await expect(promise).rejects.toThrow(/may already have been saved/i);
    xhr.upload.dispatchEvent(new Event("load"));
    xhr.dispatchEvent(new Event("load"));
    expect(xhr.abort).toHaveBeenCalledOnce();
    expect(onProcessing).not.toHaveBeenCalled();
  });
});
