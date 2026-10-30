"use client";

import {
  ArrowClockwiseIcon,
  ArrowSquareOutIcon,
  CheckCircleIcon,
  CloudArrowUpIcon,
  ImageIcon,
  TrashIcon,
  WarningCircleIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useId } from "react";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/format-bytes";
import { cn } from "@/lib/utils";
import {
  canRetryMediaUpload,
  type MediaUploadItem,
  type useMediaUploadQueue,
} from "../use-media-upload-queue";
import { MediaFilename } from "./media-filename";

export type MediaUploadPanelProps = {
  queue: ReturnType<typeof useMediaUploadQueue>;
  onBrowse: () => void;
  onClose: () => void;
  onViewMedia: (id: string) => void;
  dragging: boolean;
};

const control =
  "min-h-11 min-w-11 motion-reduce:transition-none motion-reduce:active:translate-y-0";
const iconControl = `${control} size-11`;

function statusLabel(item: MediaUploadItem) {
  switch (item.status) {
    case "queued":
      return "Queued";
    case "uploading":
      return item.progress === undefined
        ? "Uploading. Progress unavailable."
        : `Uploading · ${item.progress}% transferred`;
    case "processing":
      return "Processing image. Transfer complete.";
    case "success":
      return "Uploaded";
    case "error":
      return "Upload failed";
  }
}

// Row layout adapted from https://beui.dev/components/blocks/file-upload#upload-queue.
export function MediaUploadPanel({
  queue,
  onBrowse,
  onClose,
  onViewMedia,
  dragging,
}: MediaUploadPanelProps) {
  const headingId = useId();
  const failed = queue.items.filter((item) => item.status === "error").length;
  const completed = queue.items.filter(
    (item) => item.status === "success",
  ).length;
  const queued = queue.items.filter((item) => item.status === "queued").length;
  const active = queue.items.filter(
    (item) => item.status === "uploading" || item.status === "processing",
  ).length;
  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        "bg-card p-4 border rounded-lg min-w-0 font-sans text-foreground",
        dragging ? "border-primary ring-2 ring-primary/30" : "border-border",
      )}
    >
      <div className="flex flex-wrap justify-between items-start gap-3">
        <div className="min-w-0">
          <h2 id={headingId} className="font-semibold text-base">
            Upload images
          </h2>
          <p className="mt-1 text-muted-foreground text-sm">
            JPEG, PNG, WebP, or GIF · 10 MB per image · 10 files in the queue
          </p>
          <p role="status" className="mt-1 text-muted-foreground text-sm">
            {dragging
              ? "Drop images to add them to the queue"
              : queue.busy
                ? `${active} active · ${queued} queued · ${completed} uploaded · ${failed} failed`
                : queue.items.length
                  ? `${completed} uploaded · ${failed} failed`
                  : "Choose images to upload"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" className={control} onClick={onBrowse}>
            <CloudArrowUpIcon data-icon="inline-start" aria-hidden="true" />
            Browse files
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={iconControl}
            onClick={onClose}
            disabled={queue.busy}
            aria-label="Close upload queue"
            title={
              queue.busy
                ? "Wait for uploads to finish before closing"
                : "Close upload queue"
            }
          >
            <XIcon aria-hidden="true" />
          </Button>
        </div>
      </div>

      {queue.rejections.length > 0 && (
        <ul
          aria-label="Files not added"
          aria-live="polite"
          className="flex flex-col gap-2 mt-4 text-destructive text-sm"
        >
          {queue.rejections.map((rejection, index) => (
            // Repeated names can represent different files rejected by the same batch.
            <li
              key={`${index}-${rejection.filename}`}
              className="wrap-anywhere"
            >
              {rejection.filename}: {rejection.error}
            </li>
          ))}
        </ul>
      )}

      {queue.items.length > 0 ? (
        <ul
          aria-label="Image upload queue"
          className="flex flex-col gap-2 mt-4"
        >
          {queue.items.map((item) => {
            const activeRow =
              item.status === "uploading" || item.status === "processing";
            return (
              <li
                key={item.id}
                className="items-start gap-3 grid grid-cols-[48px_minmax(0,1fr)] sm:grid-cols-[48px_minmax(0,1fr)_auto] bg-background p-3 border border-border rounded-lg min-w-0"
              >
                <div className="flex justify-center items-center bg-muted rounded-md size-12 overflow-hidden text-muted-foreground">
                  {item.previewUrl ? (
                    // Blob previews are local and cannot use the Next.js image optimizer.
                    // biome-ignore lint/performance/noImgElement: local object URL preview
                    <img
                      src={item.previewUrl}
                      alt=""
                      width={48}
                      height={48}
                      className="size-full object-cover"
                    />
                  ) : (
                    <ImageIcon size={24} aria-hidden="true" />
                  )}
                </div>
                <div className="min-w-0">
                  <MediaFilename
                    filename={item.file.name}
                    format={item.response?.format ?? ""}
                    className="font-medium text-sm"
                  />
                  <p className="flex flex-wrap items-center gap-1.5 mt-1 text-muted-foreground text-xs">
                    {item.status === "success" && (
                      <CheckCircleIcon size={16} aria-hidden="true" />
                    )}
                    {item.status === "error" && (
                      <WarningCircleIcon size={16} aria-hidden="true" />
                    )}
                    {formatBytes(item.file.size)} · {statusLabel(item)}
                  </p>
                  {item.status === "uploading" &&
                    item.progress !== undefined && (
                      <div
                        role="progressbar"
                        aria-label={`Upload progress for ${item.file.name}`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={item.progress}
                        aria-valuetext={`${item.progress}% transferred`}
                        className="bg-muted mt-2 rounded-md h-1.5 overflow-hidden"
                      >
                        <div
                          className="bg-primary h-full transition-none motion-reduce:transition-none"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    )}
                  {item.error && (
                    <p className="mt-2 text-destructive text-sm wrap-anywhere">
                      {item.error}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap justify-end gap-2 col-span-2 sm:col-span-1">
                  {item.status === "success" && item.response && (
                    <Button
                      type="button"
                      variant="outline"
                      className={control}
                      aria-label={`View image ${item.file.name}`}
                      onClick={() => {
                        if (item.response) onViewMedia(item.response.id);
                      }}
                    >
                      View image
                      <ArrowSquareOutIcon
                        data-icon="inline-end"
                        aria-hidden="true"
                      />
                    </Button>
                  )}
                  {item.status === "error" && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className={iconControl}
                      onClick={() => queue.retry(item.id)}
                      disabled={!canRetryMediaUpload(item)}
                      aria-label={`Retry ${item.file.name}`}
                      title="Retry this image"
                    >
                      <ArrowClockwiseIcon aria-hidden="true" />
                    </Button>
                  )}
                  {!activeRow && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className={iconControl}
                      onClick={() => queue.remove(item.id)}
                      aria-label={`Remove ${item.file.name}`}
                      title="Remove from queue"
                    >
                      <TrashIcon aria-hidden="true" />
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-4 p-6 border border-border border-dashed rounded-lg text-muted-foreground text-sm text-center">
          Browse files or drop images to start uploading.
        </p>
      )}

      {(failed > 0 || completed > 0) && (
        <div className="flex flex-wrap justify-end gap-2 mt-4">
          {failed > 0 && (
            <Button
              type="button"
              variant="outline"
              className={control}
              onClick={queue.retryFailed}
              disabled={!queue.items.some(canRetryMediaUpload)}
            >
              <ArrowClockwiseIcon data-icon="inline-start" aria-hidden="true" />
              Retry failed
            </Button>
          )}
          {completed > 0 && (
            <Button
              type="button"
              variant="outline"
              className={control}
              onClick={queue.clearCompleted}
            >
              Clear completed
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
