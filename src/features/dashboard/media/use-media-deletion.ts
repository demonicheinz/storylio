"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "@/components/ui/toast";
import {
  actionCheckMediaUsage,
  actionDeleteMedia,
  actionDeleteMediaBatch,
  type MediaUsagePreview,
} from "./actions";
import type { MediaItem } from "./types";

export function useMediaDeletion({
  media,
  selectedItems,
  onDeleted,
  onBatchComplete,
}: {
  media: MediaItem[];
  selectedItems: MediaItem[];
  onDeleted: (ids: string[]) => void;
  onBatchComplete: (deletedIds: string[]) => void;
}) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const deleteTarget = media.find((item) => item.id === deleteId) ?? null;
  const [batchPreview, setBatchPreview] = useState<MediaUsagePreview | null>(
    null,
  );
  const [batchOpen, setBatchOpen] = useState(false);
  const [actionError, setActionError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const actionLock = useRef(false);
  const isLocked = () => actionLock.current;
  const requestDelete = (item: MediaItem) => {
    setActionError(undefined);
    requestAnimationFrame(() => setDeleteId(item.id));
  };
  const closeSingle = () => {
    if (actionLock.current) return false;
    setDeleteId(null);
    return true;
  };
  const closeBatch = () => {
    if (actionLock.current) return false;
    setBatchOpen(false);
    setBatchPreview(null);
    return true;
  };
  const checkUsage = () => {
    if (actionLock.current || !selectedItems.length) return;
    const ids = selectedItems.map((item) => item.id);
    actionLock.current = true;
    setActionError(undefined);
    startTransition(async () => {
      try {
        const result = await actionCheckMediaUsage(ids);
        if (!result.success) {
          toast.add({ title: result.error, type: "error" });
          return;
        }
        setBatchPreview(result.data ?? { canDelete: [], blocked: [] });
        setBatchOpen(true);
      } catch {
        toast.add({
          title:
            "Could not check image usage. Your selection is kept; try again.",
          type: "error",
        });
      } finally {
        actionLock.current = false;
      }
    });
  };
  const confirmBatch = () => {
    const ids = batchPreview?.canDelete.map((item) => item.id) ?? [];
    if (actionLock.current || !ids.length) return;
    actionLock.current = true;
    setActionError(undefined);
    startTransition(async () => {
      try {
        const result = await actionDeleteMediaBatch(ids);
        if (!result.success) {
          setActionError(result.error);
          return;
        }
        const deleted = result.data?.deletedIds ?? [];
        onDeleted(deleted);
        const failed = result.data?.failedItems ?? [];
        if (failed.length) {
          setActionError(
            `${deleted.length} ${deleted.length === 1 ? "image" : "images"} deleted. Could not delete ${failed.map((item) => `${item.filename}: ${item.error}`).join("; ")}. Retry the remaining images.`,
          );
          const failedIds = new Set(failed.map((item) => item.id));
          setBatchPreview((previous) =>
            previous
              ? {
                  ...previous,
                  canDelete: previous.canDelete.filter((item) =>
                    failedIds.has(item.id),
                  ),
                }
              : null,
          );
        } else {
          setBatchOpen(false);
          setBatchPreview(null);
          onBatchComplete(deleted);
          toast.add({
            title: `${deleted.length} ${deleted.length === 1 ? "image" : "images"} deleted.`,
            type: "success",
          });
        }
      } catch {
        setActionError(
          "Could not delete these images. Your selection is kept; try again.",
        );
      } finally {
        actionLock.current = false;
      }
    });
  };
  const confirmSingle = () => {
    if (!deleteTarget || actionLock.current) return;
    const id = deleteTarget.id;
    actionLock.current = true;
    setActionError(undefined);
    startTransition(async () => {
      try {
        const result = await actionDeleteMedia(id);
        if (!result.success) {
          setActionError(result.error);
          return;
        }
        onDeleted([id]);
        setDeleteId(null);
        toast.add({ title: "Image deleted.", type: "success" });
      } catch {
        setActionError("Could not delete this image. Try again.");
      } finally {
        actionLock.current = false;
      }
    });
  };

  return {
    deleteId,
    deleteTarget,
    batchPreview,
    batchOpen,
    actionError,
    isPending,
    isLocked,
    requestDelete,
    closeSingle,
    closeBatch,
    checkUsage,
    confirmBatch,
    confirmSingle,
  };
}
