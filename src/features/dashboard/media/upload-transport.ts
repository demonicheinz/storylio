import type { UploadResponse } from "../shared/utils/upload";

export type UploadTransportOptions = {
  signal: AbortSignal;
  onProgress?: (progress: number | undefined) => void;
  onProcessing?: () => void;
};

export const UNCERTAIN_UPLOAD_MESSAGE =
  "The image may already have been saved. Check the media library before retrying to avoid duplicates.";

function isUploadResponse(value: unknown): value is UploadResponse {
  if (!value || typeof value !== "object") return false;
  const data = value as Record<string, unknown>;
  if (
    !["id", "url", "publicId", "filename", "format"].every(
      (key) => typeof data[key] === "string" && data[key].trim().length > 0,
    )
  )
    return false;
  try {
    if (!["https:", "http:"].includes(new URL(String(data.url)).protocol))
      return false;
  } catch {
    return false;
  }
  return (
    typeof data.size === "number" &&
    Number.isFinite(data.size) &&
    data.size >= 0 &&
    ["width", "height", "aspectRatio"].every(
      (key) =>
        data[key] === null ||
        (typeof data[key] === "number" &&
          Number.isFinite(data[key]) &&
          data[key] > 0),
    ) &&
    (data.blurDataUrl === null || typeof data.blurDataUrl === "string")
  );
}

export function uploadMedia(
  file: File,
  options: UploadTransportOptions,
): Promise<UploadResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let settled = false;
    const cleanup = () => {
      options.signal.removeEventListener("abort", abort);
      xhr.upload.removeEventListener("progress", progress);
      xhr.upload.removeEventListener("load", processing);
      xhr.removeEventListener("load", load);
      xhr.removeEventListener("error", failure);
      xhr.removeEventListener("timeout", failure);
      xhr.removeEventListener("abort", failure);
    };
    const fail = (message: string) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error(message));
    };
    const failure = () =>
      fail(`Upload interrupted. ${UNCERTAIN_UPLOAD_MESSAGE}`);
    const abort = () => {
      failure();
      xhr.abort();
    };
    const progress = (event: ProgressEvent) => {
      if (!settled)
        options.onProgress?.(
          event.lengthComputable && event.total > 0
            ? Math.min(
                100,
                Math.max(0, Math.floor((event.loaded / event.total) * 100)),
              )
            : undefined,
        );
    };
    const processing = () => {
      if (!settled) options.onProcessing?.();
    };
    const load = () => {
      if (settled) return;
      let data: unknown;
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        data = null;
      }
      if (xhr.status < 200 || xhr.status >= 300) {
        const detail =
          data &&
          typeof data === "object" &&
          "error" in data &&
          typeof data.error === "string"
            ? ` ${data.error.slice(0, 500)}`
            : "";
        fail(
          `Upload failed (HTTP ${xhr.status}).${detail} ${UNCERTAIN_UPLOAD_MESSAGE}`,
        );
      } else if (!isUploadResponse(data)) {
        fail(
          `Could not confirm the upload response. ${UNCERTAIN_UPLOAD_MESSAGE}`,
        );
      } else {
        settled = true;
        cleanup();
        resolve(data);
      }
    };
    if (options.signal.aborted) {
      failure();
      return;
    }
    options.signal.addEventListener("abort", abort, { once: true });
    xhr.upload.addEventListener("progress", progress);
    xhr.upload.addEventListener("load", processing);
    xhr.addEventListener("load", load);
    xhr.addEventListener("error", failure);
    xhr.addEventListener("timeout", failure);
    xhr.addEventListener("abort", failure);
    try {
      xhr.open("POST", "/api/upload");
      xhr.timeout = 120_000;
      const body = new FormData();
      body.append("file", file);
      xhr.send(body);
    } catch {
      failure();
    }
  });
}
