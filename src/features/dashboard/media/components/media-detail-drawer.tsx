"use client";

import {
  ArrowSquareOutIcon,
  CopyIcon,
  DownloadSimpleIcon,
  PencilSimpleIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import type { ReactNode, RefObject } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatBytes } from "@/lib/format-bytes";
import { cn } from "@/lib/utils";
import {
  formatUploadedDate,
  getDimensions,
  getFormatLabel,
  getMediaAspectRatio,
} from "../presentation";
import type { MediaItem } from "../types";
import { MediaThumbnail } from "./media-thumbnail";

export function MediaDetailDrawer({
  children,
  item,
  direction,
  isPending,
  onClose,
  onRename,
  onCopy,
  onDelete,
  onDownload,
  returnFocus,
}: {
  children?: ReactNode;
  item: MediaItem | null;
  direction: "down" | "right";
  isPending: boolean;
  onClose: () => void;
  onRename: (item: MediaItem) => void;
  onCopy: (url: string) => void;
  onDelete: (item: MediaItem) => void;
  onDownload: (item: MediaItem) => Promise<void>;
  returnFocus: RefObject<HTMLElement | null>;
}) {
  const aspectRatio = item ? getMediaAspectRatio(item) : 1;
  const metadata = item
    ? [
        { label: "Uploaded", value: formatUploadedDate(item.createdAt) },
        { label: "Size", value: formatBytes(item.size) },
        { label: "Dimensions", value: getDimensions(item) },
        { label: "Type", value: getFormatLabel(item.format) },
      ]
    : [];

  return (
    <Drawer
      open={!!item}
      swipeDirection={direction}
      showSwipeHandle
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DrawerContent
        finalFocus={returnFocus}
        className={cn(
          "p-0 overflow-hidden",
          direction === "right"
            ? "h-dvh before:inset-y-0! before:right-0! before:left-0!"
            : "max-h-[86vh] before:inset-x-0! before:top-2! before:bottom-0!",
        )}
      >
        <DrawerHeader className="sr-only p-0">
          <DrawerTitle>Media details</DrawerTitle>
          <DrawerDescription>
            Preview metadata and actions for{" "}
            {item?.filename ?? "selected media"}.
          </DrawerDescription>
        </DrawerHeader>

        {item && (
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 px-4 pt-7 pb-4 min-h-0 overflow-y-auto scrollbar-none">
              <div
                className="relative bg-muted/35 border border-border rounded-xl w-full overflow-hidden"
                style={{ aspectRatio }}
              >
                <MediaThumbnail
                  item={item}
                  contain
                  sizes="(max-width: 768px) 100vw, 384px"
                />
              </div>

              <h2
                className="mt-4 font-semibold text-xl leading-tight wrap-anywhere"
                title={item.filename}
              >
                {item.filename}
              </h2>
              <div className="gap-3 grid mt-4 pt-4 border-border border-t">
                {metadata.map((row) => (
                  <div
                    key={row.label}
                    className="gap-3 grid grid-cols-[96px_minmax(0,1fr)] text-sm"
                  >
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="font-medium wrap-anywhere">
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
              <div className="space-y-2 mt-4">
                <Label htmlFor={`media-url-${item.id}`}>Image URL</Label>
                <Input
                  id={`media-url-${item.id}`}
                  readOnly
                  value={item.url}
                  onFocus={(event) => event.currentTarget.select()}
                />
              </div>
              <details className="mt-4 text-sm">
                <summary className="text-muted-foreground cursor-pointer">
                  Technical details
                </summary>
                <p className="mt-2 text-xs wrap-anywhere">
                  Asset ID: {item.publicId}
                </p>
                <p className="mt-1 text-muted-foreground text-xs">
                  {item.blurDataUrl
                    ? "Low-resolution loading placeholder available."
                    : "No loading placeholder stored."}
                </p>
              </details>
            </div>

            <DrawerFooter className="gap-2 px-4 pb-4">
              <div className="gap-2 grid grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onRename(item)}
                >
                  <PencilSimpleIcon data-icon="inline-start" />
                  Rename
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void onDownload(item)}
                >
                  <DownloadSimpleIcon data-icon="inline-start" />
                  Download
                </Button>
              </div>
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => onCopy(item.url)}
              >
                <CopyIcon data-icon="inline-start" />
                Copy URL
              </Button>
              <Button
                role="link"
                type="button"
                variant="outline"
                className="w-full"
                render={<a href={item.url} target="_blank" rel="noreferrer" />}
                nativeButton={false}
              >
                <ArrowSquareOutIcon data-icon="inline-start" />
                View
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full text-destructive"
                disabled={isPending}
                onClick={() => onDelete(item)}
              >
                <TrashIcon data-icon="inline-start" />
                Delete
              </Button>
            </DrawerFooter>
          </div>
        )}
      </DrawerContent>
      {children}
    </Drawer>
  );
}
