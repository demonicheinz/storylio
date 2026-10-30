"use client";

import {
  ArrowSquareOutIcon,
  CopyIcon,
  DotsThreeVerticalIcon,
  DownloadSimpleIcon,
  ImageIcon,
  PencilSimpleIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatBytes } from "@/lib/format-bytes";
import { cn } from "@/lib/utils";
import { getMediaDisplayFilename } from "../filename";
import { getDimensions } from "../presentation";
import type { MediaItem } from "../types";
import { MediaFilename } from "./media-filename";
import { MediaThumbnail } from "./media-thumbnail";

function MediaActionsMenu({
  item,
  isPending,
  onSelect,
  onRename,
  onCopy,
  onDelete,
  onDownload,
  overlay = false,
}: {
  item: MediaItem;
  isPending: boolean;
  onSelect: (item: MediaItem) => void;
  onRename: (item: MediaItem) => void;
  onCopy: (url: string) => void;
  onDelete: (item: MediaItem) => void;
  onDownload: (item: MediaItem) => Promise<void>;
  overlay?: boolean;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            ref={triggerRef}
            type="button"
            size="icon"
            variant={overlay ? "secondary" : "ghost"}
            className={cn(
              "size-11",
              overlay &&
                "bg-popover/80 border-border shadow-sm hover:bg-surface-hover/90",
            )}
            disabled={isPending}
            aria-label={`Open actions for ${item.filename}`}
          />
        }
      >
        <DotsThreeVerticalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem
          onClick={() => {
            triggerRef.current?.focus();
            onSelect(item);
          }}
        >
          <ImageIcon data-icon="inline-start" />
          Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onRename(item)}>
          <PencilSimpleIcon data-icon="inline-start" />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onCopy(item.url)}>
          <CopyIcon data-icon="inline-start" />
          Copy URL
        </DropdownMenuItem>
        <DropdownMenuItem
          render={<a href={item.url} target="_blank" rel="noreferrer" />}
        >
          <ArrowSquareOutIcon data-icon="inline-start" />
          View
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void onDownload(item)}>
          <DownloadSimpleIcon data-icon="inline-start" />
          Download
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={isPending}
          onClick={() => onDelete(item)}
        >
          <TrashIcon data-icon="inline-start" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type MediaRowProps = {
  item: MediaItem;
  isSelected: boolean;
  isSelectionMode: boolean;
  isPending: boolean;
  onSelect: (item: MediaItem) => void;
  onRename: (item: MediaItem) => void;
  onToggleSelection: (item: MediaItem) => void;
  onCopy: (url: string) => void;
  onDelete: (item: MediaItem) => void;
  onDownload: (item: MediaItem) => Promise<void>;
};

export function MediaCard({
  item,
  isSelected,
  isSelectionMode,
  isPending,
  onSelect,
  onRename,
  onToggleSelection,
  onCopy,
  onDelete,
  onDownload,
}: MediaRowProps) {
  const activate = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.currentTarget.focus();
    if (isSelectionMode) onToggleSelection(item);
    else onSelect(item);
  };
  return (
    <article
      className={cn(
        "group relative bg-card border hover:border-input rounded-lg min-w-0 overflow-hidden transition-colors",
        isSelected ? "border-primary" : "border-border",
      )}
    >
      <div className="relative bg-muted/35 aspect-square overflow-hidden">
        <MediaThumbnail item={item} />
        <button
          type="button"
          disabled={isPending}
          className="absolute inset-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset cursor-pointer"
          aria-label={`${isSelectionMode ? "Select" : "Preview"} ${item.filename}`}
          aria-pressed={isSelectionMode ? isSelected : undefined}
          onClick={activate}
        />
        {isSelectionMode && (
          <div
            className="top-3 left-3 z-10 absolute"
            onClick={(event) => event.stopPropagation()}
          >
            <Checkbox
              disabled={isPending}
              className="after:-inset-x-3.5 after:-inset-y-3.5"
              checked={isSelected}
              onCheckedChange={() => onToggleSelection(item)}
              aria-label={`Select ${item.filename}`}
            />
          </div>
        )}
        <div className="top-3 right-3 absolute">
          <MediaActionsMenu
            item={item}
            isPending={isPending}
            overlay
            onSelect={onSelect}
            onRename={onRename}
            onCopy={onCopy}
            onDelete={onDelete}
            onDownload={onDownload}
          />
        </div>
      </div>
      <div className="space-y-2 p-3">
        <h2 className="font-sans font-semibold text-sm truncate leading-snug">
          <button
            type="button"
            disabled={isPending}
            className="rounded-sm focus-visible:outline-2 focus-visible:outline-ring w-full min-w-0 hover:text-link text-left"
            aria-label={getMediaDisplayFilename(item.filename, item.format)}
            onClick={activate}
          >
            <MediaFilename filename={item.filename} format={item.format} />
          </button>
        </h2>
        <div className="flex flex-wrap items-center gap-1.5 min-w-0 text-muted-foreground text-xs">
          <span>{formatBytes(item.size)}</span>
          <span aria-hidden>·</span>
          <span>{getDimensions(item)}</span>
        </div>
      </div>
    </article>
  );
}

const MEDIA_COLUMNS = "xl:grid-cols-[minmax(0,1fr)_110px_140px_68px]";
const MEDIA_COLUMNS_SELECTED =
  "xl:grid-cols-[44px_minmax(0,1fr)_110px_140px_68px]";
export function MediaListHeader({ selecting }: { selecting: boolean }) {
  return (
    <div
      data-media-list-header
      className={cn(
        "hidden xl:grid border-border border-b font-medium text-muted-foreground text-xs",
        selecting ? MEDIA_COLUMNS_SELECTED : MEDIA_COLUMNS,
      )}
    >
      {selecting && <div />}
      <div className="py-3 pr-3 pl-34">Name</div>
      <div className="p-3">Size</div>
      <div className="p-3">Dimensions</div>
      <div className="p-3 text-center">Actions</div>
    </div>
  );
}
export function MediaListRow({
  item,
  isSelected,
  isSelectionMode,
  isPending,
  onSelect,
  onRename,
  onToggleSelection,
  onCopy,
  onDelete,
  onDownload,
}: MediaRowProps) {
  return (
    <div
      className={cn(
        "xl:items-center grid hover:bg-muted/20 min-w-0 text-left transition-colors",
        isSelectionMode
          ? "grid-cols-[44px_minmax(0,1fr)]"
          : "grid-cols-[minmax(0,1fr)]",
        isSelectionMode ? MEDIA_COLUMNS_SELECTED : MEDIA_COLUMNS,
        isSelected && "bg-primary/5",
      )}
    >
      {isSelectionMode && (
        <div className="flex justify-center items-center self-stretch row-span-2 xl:row-span-1 border-border border-r">
          <Checkbox
            disabled={isPending}
            className="after:-inset-x-3.5 after:-inset-y-3.5"
            checked={isSelected}
            onCheckedChange={() => onToggleSelection(item)}
            aria-label={`Select ${item.filename}`}
          />
        </div>
      )}
      <button
        type="button"
        disabled={isPending}
        className="flex items-center gap-3 p-3 min-w-0 text-left"
        aria-label={`${isSelectionMode ? "Select" : "Preview"} ${item.filename}`}
        aria-pressed={isSelectionMode ? isSelected : undefined}
        onClick={(event) => {
          event.currentTarget.focus();
          if (isSelectionMode) onToggleSelection(item);
          else onSelect(item);
        }}
      >
        <div
          data-media-list-thumbnail
          className="relative bg-muted/35 border border-border/50 rounded-xl w-28 h-16 overflow-hidden shrink-0"
        >
          <MediaThumbnail item={item} sizes="112px" />
        </div>
        <MediaFilename
          filename={item.filename}
          format={item.format}
          className="font-semibold text-sm"
        />
      </button>
      <div className="hidden xl:block p-3 text-muted-foreground text-sm">
        {formatBytes(item.size)}
      </div>
      <div className="hidden xl:block p-3 text-muted-foreground text-sm">
        {getDimensions(item)}
      </div>
      <div
        className={cn(
          "xl:hidden flex justify-between items-center gap-3 px-3 pb-3 min-w-0",
          isSelectionMode ? "col-start-2" : "col-start-1",
        )}
      >
        <div className="flex flex-wrap items-center gap-2 min-w-0 text-muted-foreground text-xs">
          <span>{formatBytes(item.size)}</span>
          <span aria-hidden>·</span>
          <span>{getDimensions(item)}</span>
        </div>
        <MediaActionsMenu
          item={item}
          isPending={isPending}
          onSelect={onSelect}
          onRename={onRename}
          onCopy={onCopy}
          onDelete={onDelete}
          onDownload={onDownload}
        />
      </div>
      <div className="hidden xl:flex justify-center p-3">
        <MediaActionsMenu
          item={item}
          isPending={isPending}
          onSelect={onSelect}
          onRename={onRename}
          onCopy={onCopy}
          onDelete={onDelete}
          onDownload={onDownload}
        />
      </div>
    </div>
  );
}
