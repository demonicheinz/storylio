"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { confirmAction } from "@/features/dashboard/shared/confirmation";
import { actionRenameMedia } from "../actions";
import type { MediaItem } from "../types";

export function MediaRenameDialog({
  item,
  onClose,
  onRenamed,
}: {
  item: MediaItem | null;
  onClose: () => void;
  onRenamed: (data: { id: string; filename: string }) => void;
}) {
  const id = useId();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  const locked = useRef(false);
  useEffect(() => {
    setValue(item?.filename ?? "");
    setError(undefined);
  }, [item?.id, item?.filename]);
  const close = (open: boolean, details?: { cancel: () => void }) => {
    if (open) return;
    if (locked.current) {
      details?.cancel();
      return;
    }
    if (item && value !== item.filename) {
      details?.cancel();
      void confirmAction("Discard unsaved changes to this file name?").then(
        (approved) => {
          if (approved && !locked.current) onClose();
        },
      );
      return;
    }
    onClose();
  };
  return (
    <Dialog
      open={!!item}
      onOpenChange={close}
      disablePointerDismissal={pending}
    >
      <DialogContent>
        <form
          className="space-y-5"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!item || locked.current) return;
            const filename = value.trim();
            if (!filename) {
              setError("File name is required.");
              return;
            }
            locked.current = true;
            setPending(true);
            setError(undefined);
            try {
              const result = await actionRenameMedia(item.id, filename);
              if (!result.success) {
                setError(result.error);
                return;
              }
              onRenamed(result.data ?? { id: item.id, filename });
            } catch {
              setError(
                "Could not rename this image. Your input is kept; try again.",
              );
            } finally {
              locked.current = false;
              setPending(false);
            }
          }}
          aria-busy={pending}
        >
          <DialogHeader>
            <DialogTitle>Rename media</DialogTitle>
            <DialogDescription>
              Update the library file name. The image URL stays the same.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor={id}>File name</Label>
            <Input
              id={id}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              maxLength={160}
              autoFocus
              disabled={pending}
              aria-invalid={!!error}
              aria-describedby={error ? `${id}-error` : `${id}-hint`}
            />
            <p id={`${id}-hint`} className="text-muted-foreground text-xs">
              {value.length}/160 characters
            </p>
            {error && (
              <p
                id={`${id}-error`}
                role="alert"
                className="text-destructive text-sm"
              >
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => close(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !value.trim()}>
              {pending ? "Saving..." : "Save name"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
