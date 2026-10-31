"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { useMediaDeletion } from "../use-media-deletion";

function formatReferenceSummary(
  references: Array<{ label: string; count: number }>,
): string {
  return references
    .map(({ label, count }) => `${count} ${label}${count === 1 ? "" : "s"}`)
    .join(", ");
}

export function MediaDeleteDialogs({
  deletion,
}: {
  deletion: ReturnType<typeof useMediaDeletion>;
}) {
  const {
    deleteTarget,
    batchPreview,
    batchOpen,
    actionError,
    isPending,
    closeSingle,
    closeBatch,
    confirmSingle,
    confirmBatch,
  } = deletion;
  return (
    <>
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open, details) => {
          if (!open) {
            if (!closeSingle()) details.cancel();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete media?</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete {deleteTarget?.filename}? Images still used by
              content are protected. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {actionError && (
            <p role="alert" className="text-destructive text-sm wrap-anywhere">
              {actionError}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isPending}
              onClick={confirmSingle}
            >
              {isPending ? "Deleting..." : "Delete image"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={batchOpen}
        onOpenChange={(open, details) => {
          if (!open) {
            if (!closeBatch()) details.cancel();
          }
        }}
      >
        <AlertDialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete selected media?</AlertDialogTitle>
            <AlertDialogDescription>
              Review the images below. Images still in use are protected;
              references are checked again before deletion.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {batchPreview && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-sm">
                  Can delete ({batchPreview.canDelete.length})
                </h3>
                <ul
                  aria-label="Images to delete"
                  className="space-y-1 mt-2 max-h-40 overflow-y-auto text-sm"
                >
                  {batchPreview.canDelete.map((item) => (
                    <li key={item.id} className="wrap-anywhere">
                      {item.filename}
                    </li>
                  ))}
                </ul>
              </div>
              {batchPreview.blocked.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm">
                    Still in use ({batchPreview.blocked.length})
                  </h3>
                  <ul
                    aria-label="Protected images"
                    className="space-y-2 mt-2 max-h-40 overflow-y-auto text-sm"
                  >
                    {batchPreview.blocked.map((item) => (
                      <li key={item.id} className="wrap-anywhere">
                        {item.filename}
                        <p className="text-muted-foreground text-xs">
                          Used by {formatReferenceSummary(item.references)}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          {actionError && (
            <p role="alert" className="text-destructive text-sm wrap-anywhere">
              {actionError}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Close</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isPending || !batchPreview?.canDelete.length}
              onClick={confirmBatch}
            >
              {isPending
                ? "Deleting..."
                : `Delete ${batchPreview?.canDelete.length ?? 0} ${batchPreview?.canDelete.length === 1 ? "image" : "images"}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
