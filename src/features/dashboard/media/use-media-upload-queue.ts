"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { UploadResponse } from "../shared/utils/upload";
import { UNCERTAIN_UPLOAD_MESSAGE, uploadMedia } from "./upload-transport";

export type MediaUploadItem = {
  id: string;
  file: File;
  previewUrl: string;
  status: "queued" | "uploading" | "processing" | "success" | "error";
  progress?: number;
  error?: string;
  response?: UploadResponse;
};

export type MediaUploadRejection = { filename: string; error: string };
type Snapshot = {
  items: MediaUploadItem[];
  busy: boolean;
  // Overflow and duplicate notices retain names, rather than extra File objects.
  rejections: MediaUploadRejection[];
};
type QueueOptions = { onUploaded: (data: UploadResponse) => void };

const MAX_ITEMS = 10;
const MAX_BYTES = 10 * 1024 * 1024;
const TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const EMPTY: Snapshot = { items: [], rejections: [], busy: false };

function validationError(file: File): string | undefined {
  if (!TYPES.has(file.type)) return "Choose a JPEG, PNG, WebP, or GIF image.";
  if (file.size > MAX_BYTES)
    return "This image exceeds the 10 MB limit per file.";
}

export function canRetryMediaUpload(item: MediaUploadItem): boolean {
  return item.status === "error" && !validationError(item.file);
}

function fileKey(file: File): string {
  return JSON.stringify([file.name, file.size, file.type, file.lastModified]);
}

/** The controller is also exercised directly by tests, without a DOM or network. */
export function createMediaUploadQueue(
  onUploaded: QueueOptions["onUploaded"],
  dependencies = {
    transport: uploadMedia,
    createPreview: (file: File) => URL.createObjectURL(file),
    revokePreview: (url: string) => URL.revokeObjectURL(url),
  },
) {
  let snapshot = EMPTY;
  let mounted = false;
  const listeners = new Set<() => void>();
  const running = new Map<string, AbortController>();

  function publish(items = snapshot.items, rejections = snapshot.rejections) {
    snapshot = {
      items,
      rejections,
      busy: items.some(
        (item) =>
          item.status === "queued" ||
          item.status === "uploading" ||
          item.status === "processing",
      ),
    };
    for (const listener of listeners) listener();
  }

  function patch(id: string, value: Partial<MediaUploadItem>) {
    publish(
      snapshot.items.map((item) =>
        item.id === id ? { ...item, ...value } : item,
      ),
    );
  }

  function revoke(item: MediaUploadItem) {
    if (item.previewUrl) dependencies.revokePreview(item.previewUrl);
  }

  function pump() {
    if (!mounted) return;
    for (const item of snapshot.items) {
      if (!mounted || running.size >= 2) break;
      if (item.status !== "queued" || running.has(item.id)) continue;
      const abort = new AbortController();
      running.set(item.id, abort);
      patch(item.id, {
        status: "uploading",
        error: undefined,
        progress: undefined,
      });
      const live = () => mounted && running.get(item.id) === abort;
      const transfer = () =>
        dependencies.transport(item.file, {
          signal: abort.signal,
          onProgress: (progress) => {
            if (
              live() &&
              snapshot.items.find((row) => row.id === item.id)?.status ===
                "uploading"
            ) {
              patch(item.id, { progress });
            }
          },
          onProcessing: () => {
            if (live()) patch(item.id, { status: "processing" });
          },
        });
      let request: Promise<UploadResponse>;
      try {
        request = transfer();
      } catch (error) {
        request = Promise.reject(error);
      }
      void request.then(
        (data) => {
          if (!live()) return;
          running.delete(item.id);
          patch(item.id, { status: "success", response: data });
          try {
            onUploaded(data);
          } catch (error) {
            console.error("Media upload callback failed", error);
          }
          pump();
        },
        (error: unknown) => {
          if (!live()) return;
          running.delete(item.id);
          patch(item.id, {
            status: "error",
            error:
              error instanceof Error
                ? error.message
                : `Upload interrupted. ${UNCERTAIN_UPLOAD_MESSAGE}`,
          });
          pump();
        },
      );
    }
  }

  function addFiles(files: File[]) {
    if (!mounted) return [];
    const items = [...snapshot.items];
    const seen = new Set(items.map((item) => fileKey(item.file)));
    const rejections: MediaUploadRejection[] = [];
    for (const file of files) {
      const key = fileKey(file);
      if (seen.has(key)) {
        rejections.push({
          filename: file.name,
          error: "This file is already in the queue.",
        });
      } else if (items.length >= MAX_ITEMS) {
        rejections.push({
          filename: file.name,
          error:
            "The queue holds 10 files. Remove a row or clear completed uploads, then add this file again.",
        });
      } else {
        seen.add(key);
        const error = validationError(file);
        items.push({
          id: crypto.randomUUID(),
          file,
          previewUrl: error ? "" : dependencies.createPreview(file),
          status: error ? "error" : "queued",
          error,
        });
      }
    }
    publish(items, rejections);
    pump();
    return rejections;
  }

  function retry(id: string) {
    if (!mounted) return;
    const item = snapshot.items.find((row) => row.id === id);
    if (!item || !canRetryMediaUpload(item)) return;
    patch(id, { status: "queued", error: undefined, progress: undefined });
    pump();
  }

  return {
    getSnapshot: () => snapshot,
    getServerSnapshot: () => EMPTY,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    activate() {
      if (mounted) return;
      mounted = true;
      publish(
        snapshot.items.map((item) =>
          !item.previewUrl && !validationError(item.file)
            ? { ...item, previewUrl: dependencies.createPreview(item.file) }
            : item,
        ),
      );
      pump();
    },
    deactivate() {
      if (!mounted) return;
      mounted = false;
      const requests = [...running.values()];
      running.clear();
      for (const abort of requests) abort.abort();
      publish(
        snapshot.items.map((item) => {
          revoke(item);
          return {
            ...item,
            previewUrl: "",
            ...(item.status === "uploading" || item.status === "processing"
              ? {
                  status: "error" as const,
                  error: `Upload interrupted. ${UNCERTAIN_UPLOAD_MESSAGE}`,
                }
              : {}),
          };
        }),
      );
    },
    addFiles,
    retry,
    retryFailed() {
      if (!mounted) return;
      publish(
        snapshot.items.map((item) =>
          canRetryMediaUpload(item)
            ? {
                ...item,
                status: "queued",
                error: undefined,
                progress: undefined,
              }
            : item,
        ),
      );
      pump();
    },
    remove(id: string) {
      if (!mounted) return;
      const item = snapshot.items.find((row) => row.id === id);
      if (!item || item.status === "uploading" || item.status === "processing")
        return;
      revoke(item);
      publish(snapshot.items.filter((row) => row.id !== id));
    },
    clearCompleted() {
      if (!mounted) return;
      for (const item of snapshot.items)
        if (item.status === "success") revoke(item);
      publish(snapshot.items.filter((item) => item.status !== "success"));
    },
  };
}

export function useMediaUploadQueue({ onUploaded }: QueueOptions) {
  const callback = useRef(onUploaded);
  useEffect(() => {
    callback.current = onUploaded;
  }, [onUploaded]);
  const [controller] = useState(() =>
    createMediaUploadQueue((data) => callback.current(data)),
  );
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getServerSnapshot,
  );
  useEffect(() => {
    controller.activate();
    return () => controller.deactivate();
  }, [controller]);
  return {
    ...state,
    addFiles: controller.addFiles,
    retry: controller.retry,
    retryFailed: controller.retryFailed,
    remove: controller.remove,
    clearCompleted: controller.clearCompleted,
  };
}
