"use client";

import {
  ArrowSquareOutIcon,
  CheckSquareIcon,
  CloudArrowUpIcon,
  CopyIcon,
  DotsThreeVerticalIcon,
  DownloadSimpleIcon,
  FunnelSimpleIcon,
  ImageIcon,
  MagnifyingGlassIcon,
  PencilSimpleIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import toolbarStyles from "@/features/dashboard/shared/components/collection-toolbar.module.css";
import {
  DashboardSort,
  DashboardViewToggle,
} from "@/features/dashboard/shared/components/filter-controls";
import { DashboardPagination } from "@/features/dashboard/shared/components/pagination";
import { DashboardSummary } from "@/features/dashboard/shared/components/summary";
import { dashboardStyles } from "@/features/dashboard/shared/styles";
import type { UploadResponse } from "@/features/dashboard/shared/utils/upload";
import { formatBytes } from "@/lib/format-bytes";
import {
  getDefaultItemsPerPage,
  getItemsPerPageOptions,
  paginateItems,
} from "@/lib/pagination";
import { cn } from "@/lib/utils";
import {
  actionCheckMediaUsage,
  actionDeleteMedia,
  actionDeleteMediaBatch,
  type MediaUsagePreview,
} from "../actions";
import { MEDIA_BATCH_LIMIT } from "../constants";
import { getMediaDisplayFilename } from "../filename";
import { getDimensions } from "../presentation";
import {
  type MediaSortDirection,
  type MediaSortField,
  sortMediaItems,
} from "../sorting";
import type { MediaItem } from "../types";
import { useMediaUploadQueue } from "../use-media-upload-queue";
import { MediaDetailDrawer } from "./media-detail-drawer";
import { MediaFilename } from "./media-filename";
import { MediaRenameDialog } from "./media-rename-dialog";
import { MediaThumbnail } from "./media-thumbnail";
import { MediaUploadPanel } from "./media-upload-queue";

type MediaLibraryClientProps = {
  initialMedia: MediaItem[];
};

type ViewMode = "grid" | "list";
const sortOptions: Array<{ value: MediaSortField; label: string }> = [
  { value: "date", label: "Upload date" },
  { value: "size", label: "File size" },
  { value: "name", label: "File name" },
  { value: "format", label: "Format" },
];

function formatReferenceSummary(
  references: Array<{ label: string; count: number }>,
): string {
  return references
    .map(({ label, count }) => `${count} ${label}${count === 1 ? "" : "s"}`)
    .join(", ");
}

function getMediaDownloadUrl(item: MediaItem): string {
  return `/api/media/${item.id}/download`;
}

async function downloadMedia(item: MediaItem) {
  let objectUrl: string | undefined;
  try {
    const response = await fetch(getMediaDownloadUrl(item));
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw Error(data?.error ?? "Download failed. Try again.");
    }
    const url = URL.createObjectURL(await response.blob());
    objectUrl = url;
    const anchor = document.createElement("a");
    anchor.href = url;
    const encoded = response.headers
      .get("content-disposition")
      ?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
    anchor.download = encoded ? decodeURIComponent(encoded) : item.filename;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
  } catch (error) {
    toast.add({
      title:
        error instanceof Error
          ? error.message
          : "Could not download this image. Try again.",
      type: "error",
    });
  } finally {
    if (objectUrl) {
      const url = objectUrl;
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }
}

function MediaActionsMenu({
  item,
  isPending,
  onSelect,
  onRename,
  onCopy,
  onDelete,
  overlay = false,
}: {
  item: MediaItem;
  isPending: boolean;
  onSelect: (item: MediaItem) => void;
  onRename: (item: MediaItem) => void;
  onCopy: (url: string) => void;
  onDelete: (item: MediaItem) => void;
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
        <DropdownMenuItem onClick={() => void downloadMedia(item)}>
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
};

function MediaCard({
  item,
  isSelected,
  isSelectionMode,
  isPending,
  onSelect,
  onRename,
  onToggleSelection,
  onCopy,
  onDelete,
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
          <div className="top-3 left-3 absolute flex justify-center items-center bg-popover border border-border rounded-md size-11">
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
function MediaListHeader({ selecting }: { selecting: boolean }) {
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
function MediaListRow({
  item,
  isSelected,
  isSelectionMode,
  isPending,
  onSelect,
  onRename,
  onToggleSelection,
  onCopy,
  onDelete,
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
        />
      </div>
    </div>
  );
}

export function MediaLibraryClient({ initialMedia }: MediaLibraryClientProps) {
  const [media, setMedia] = useState(initialMedia);
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<MediaSortField>("date");
  const [sortDirection, setSortDirection] =
    useState<MediaSortDirection>("desc");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [itemsPerPage, setItemsPerPage] = useState<number>(
    getDefaultItemsPerPage("grid"),
  );
  const [page, setPage] = useState(1);
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const selectedMedia =
    media.find((item) => item.id === selectedMediaId) ?? null;
  const [renameId, setRenameId] = useState<string | null>(null);
  const renameTarget = media.find((item) => item.id === renameId) ?? null;
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const deleteTarget = media.find((item) => item.id === deleteId) ?? null;
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchPreview, setBatchPreview] = useState<MediaUsagePreview | null>(
    null,
  );
  const [batchOpen, setBatchOpen] = useState(false);
  const [actionError, setActionError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const actionLock = useRef(false);
  const detailTriggerRef = useRef<HTMLElement | null>(null);
  const [drawerDirection, setDrawerDirection] = useState<"down" | "right">(
    "down",
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draftSort, setDraftSort] = useState<MediaSortField>("date");
  const [draftDirection, setDraftDirection] =
    useState<MediaSortDirection>("desc");
  const [draftView, setDraftView] = useState<ViewMode>("grid");
  const filtersTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileSearchRef = useRef<HTMLInputElement>(null);
  const desktopSearchRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const uploadManual = useRef(false);
  const uploaded = useCallback(
    (data: UploadResponse) =>
      setMedia((previous) => [
        { ...data, createdAt: new Date() },
        ...previous.filter((item) => item.id !== data.id),
      ]),
    [],
  );
  const queue = useMediaUploadQueue({ onUploaded: uploaded });
  const addFiles = useRef(queue.addFiles);
  addFiles.current = queue.addFiles;
  const queueSize = useRef(queue.items.length);
  queueSize.current = queue.items.length;
  const selectedItems = media.filter((item) => selectedIds.has(item.id));

  useEffect(() => {
    const ids = new Set(media.map((item) => item.id));
    setSelectedIds((previous) => {
      const next = new Set([...previous].filter((id) => ids.has(id)));
      return next.size === previous.size ? previous : next;
    });
  }, [media]);
  useEffect(() => {
    const mq = matchMedia("(min-width:768px)");
    const sync = () => setDrawerDirection(mq.matches ? "right" : "down");
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() !== "k" ||
        !(event.ctrlKey || event.metaKey) ||
        selectedMediaId ||
        renameId ||
        deleteId ||
        batchOpen ||
        filtersOpen
      )
        return;
      event.preventDefault();
      const input = matchMedia("(max-width:767px)").matches
        ? mobileSearchRef.current
        : desktopSearchRef.current;
      input?.focus();
      input?.select();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [selectedMediaId, renameId, deleteId, batchOpen, filtersOpen]);
  useEffect(() => {
    let depth = 0;
    const isFiles = (event: globalThis.DragEvent) =>
      Array.from(event.dataTransfer?.types ?? []).includes("Files");
    const enter = (event: globalThis.DragEvent) => {
      if (!isFiles(event)) return;
      event.preventDefault();
      depth++;
      setDragging(true);
      setUploadOpen(true);
    };
    const over = (event: globalThis.DragEvent) => {
      if (!isFiles(event)) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
    };
    const leave = (event: globalThis.DragEvent) => {
      if (!isFiles(event)) return;
      depth = Math.max(0, depth - 1);
      if (!depth) {
        setDragging(false);
        if (!uploadManual.current && !queueSize.current) setUploadOpen(false);
      }
    };
    const drop = (event: globalThis.DragEvent) => {
      if (!isFiles(event)) return;
      event.preventDefault();
      depth = 0;
      setDragging(false);
      uploadManual.current = true;
      setUploadOpen(true);
      addFiles.current(Array.from(event.dataTransfer?.files ?? []));
    };
    document.addEventListener("dragenter", enter);
    document.addEventListener("dragover", over);
    document.addEventListener("dragleave", leave);
    document.addEventListener("drop", drop);
    return () => {
      document.removeEventListener("dragenter", enter);
      document.removeEventListener("dragover", over);
      document.removeEventListener("dragleave", leave);
      document.removeEventListener("drop", drop);
    };
  }, []);
  useEffect(() => {
    if (!queue.busy) return;
    const unload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const navigate = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const anchor =
        event.target instanceof Element
          ? event.target.closest("a[href]")
          : null;
      if (
        !(anchor instanceof HTMLAnchorElement) ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download")
      )
        return;
      const next = new URL(anchor.href, location.href);
      if (
        !["http:", "https:"].includes(next.protocol) ||
        (next.origin === location.origin &&
          next.pathname === location.pathname &&
          next.search === location.search)
      )
        return;
      if (
        !window.confirm(
          "Leave Media? Uploads may be interrupted. Completed images remain in the library.",
        )
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", navigate, true);
    return () => {
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("click", navigate, true);
    };
  }, [queue.busy]);

  const filteredMedia = useMemo(() => {
    const search = query.trim().toLowerCase();
    return sortMediaItems(
      media.filter(
        (item) =>
          !search ||
          [item.filename, item.publicId, item.format].some((value) =>
            value.toLowerCase().includes(search),
          ),
      ),
      sortMode,
      sortDirection,
    );
  }, [media, query, sortMode, sortDirection]);
  const {
    items: paginatedMedia,
    pageCount,
    currentPage,
    firstIndex,
    lastIndex,
  } = paginateItems(filteredMedia, page, itemsPerPage);
  const itemsPerPageOptions = getItemsPerPageOptions(viewMode);
  const pageSelected =
    paginatedMedia.length > 0 &&
    paginatedMedia.every((item) => selectedIds.has(item.id));
  const outsideCount = selectedItems.filter(
    (item) => !paginatedMedia.some((row) => row.id === item.id),
  ).length;
  const filterCount = Number(sortMode !== "date" || sortDirection !== "desc");
  const refined = filterCount > 0 || !!query.trim();
  useEffect(() => setPage(1), [itemsPerPage, query, sortMode, sortDirection]);
  const changeView = (value: ViewMode) => {
    setViewMode(value);
    if (value !== viewMode) setItemsPerPage(getDefaultItemsPerPage(value));
  };
  const clearFilters = () => {
    setQuery("");
    setSortMode("date");
    setSortDirection("desc");
  };
  const openFilters = (open: boolean) => {
    if (open) {
      setDraftSort(sortMode);
      setDraftDirection(sortDirection);
      setDraftView(viewMode);
    }
    setFiltersOpen(open);
  };
  const applyFilters = () => {
    setSortMode(draftSort);
    setSortDirection(draftDirection);
    changeView(draftView);
    setFiltersOpen(false);
  };
  const clearSelection = () => {
    if (actionLock.current) return;
    setSelectedIds(new Set());
    setIsSelectionMode(false);
    setBatchPreview(null);
    setBatchOpen(false);
  };
  const selectionLimit = () =>
    toast.add({
      title: `Select no more than ${MEDIA_BATCH_LIMIT} images at a time.`,
      type: "error",
    });
  const toggleSelection = (item: MediaItem) => {
    if (actionLock.current) return;
    if (!selectedIds.has(item.id) && selectedIds.size >= MEDIA_BATCH_LIMIT) {
      selectionLimit();
      return;
    }
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(item.id)) next.delete(item.id);
      else next.add(item.id);
      return next;
    });
  };
  const togglePage = () => {
    if (actionLock.current) return;
    const next = new Set(selectedIds);
    for (const item of paginatedMedia) {
      if (pageSelected) next.delete(item.id);
      else if (next.size < MEDIA_BATCH_LIMIT) next.add(item.id);
    }
    if (!pageSelected && paginatedMedia.some((item) => !next.has(item.id)))
      selectionLimit();
    setSelectedIds(next);
  };
  const openDetails = (item: MediaItem) => {
    detailTriggerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    requestAnimationFrame(() => setSelectedMediaId(item.id));
  };
  const onRename = (item: MediaItem) =>
    requestAnimationFrame(() => setRenameId(item.id));
  const onDelete = (item: MediaItem) => {
    setActionError(undefined);
    requestAnimationFrame(() => setDeleteId(item.id));
  };
  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.add({ title: "Image URL copied.", type: "success" });
    } catch {
      setSelectedMediaId(media.find((item) => item.url === url)?.id ?? null);
      toast.add({
        title:
          "Could not copy the URL. Select Image URL in the details to copy it manually.",
        type: "error",
      });
    }
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
  const removeRows = (ids: string[]) => {
    const removed = new Set(ids);
    setMedia((previous) => previous.filter((item) => !removed.has(item.id)));
    setSelectedIds(
      (previous) => new Set([...previous].filter((id) => !removed.has(id))),
    );
    if (selectedMediaId && removed.has(selectedMediaId))
      setSelectedMediaId(null);
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
        removeRows(deleted);
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
          setIsSelectionMode(
            selectedItems.some((item) => !deleted.includes(item.id)),
          );
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
        removeRows([id]);
        setDeleteId(null);
        toast.add({ title: "Image deleted.", type: "success" });
      } catch {
        setActionError("Could not delete this image. Try again.");
      } finally {
        actionLock.current = false;
      }
    });
  };
  const browse = () => {
    uploadManual.current = true;
    setUploadOpen(true);
    inputRef.current?.click();
  };
  const renderFilters = (mobile = false) => (
    <DashboardSort
      value={mobile ? draftSort : sortMode}
      options={sortOptions}
      onValueChange={(value) =>
        mobile ? setDraftSort(value) : setSortMode(value)
      }
      direction={mobile ? draftDirection : sortDirection}
      onDirectionChange={mobile ? setDraftDirection : setSortDirection}
    />
  );
  const rowProps = (item: MediaItem) => ({
    item,
    isSelected: selectedIds.has(item.id),
    isSelectionMode,
    isPending,
    onSelect: openDetails,
    onRename,
    onToggleSelection: toggleSelection,
    onCopy: copy,
    onDelete,
  });

  return (
    <Drawer
      open={filtersOpen}
      onOpenChange={openFilters}
      swipeDirection="down"
      showSwipeHandle
    >
      <div className={dashboardStyles.page}>
        <div className={dashboardStyles.header}>
          <div className="min-w-0">
            <h1 className="font-heading font-bold text-3xl">Media Library</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground text-sm leading-6">
              Upload, inspect, and manage images used across Storylio.
            </p>
          </div>
          <Button type="button" onClick={browse} className="shrink-0">
            <CloudArrowUpIcon data-icon="inline-start" />
            Upload
          </Button>
        </div>
        <DashboardSummary
          items={[
            { label: "Images", value: media.length },
            {
              label: "Storage",
              value: formatBytes(
                media.reduce((sum, item) => sum + item.size, 0),
              ),
            },
          ]}
        />
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          aria-label="Choose images to upload"
          onChange={(event) => {
            queue.addFiles(Array.from(event.currentTarget.files ?? []));
            event.currentTarget.value = "";
          }}
        />
        <Card className={dashboardStyles.toolbarCard}>
          <CardContent
            className={cn(
              dashboardStyles.toolbarContent,
              "[&_input]:min-h-11 [&_button]:min-h-11",
            )}
          >
            <div className={cn("md:hidden", toolbarStyles.mobileToolbar)}>
              <div className={toolbarStyles.mobileRow}>
                <div className={toolbarStyles.mobileSearch}>
                  <MagnifyingGlassIcon
                    aria-hidden
                    className="top-1/2 left-3 absolute size-4 text-muted-foreground -translate-y-1/2 pointer-events-none"
                  />
                  <Input
                    ref={mobileSearchRef}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search..."
                    aria-label="Search media"
                    className="pr-3 pl-9"
                  />
                </div>
                <DrawerTrigger
                  render={
                    <Button
                      ref={filtersTriggerRef}
                      type="button"
                      size="icon"
                      variant="outline"
                      className="relative p-0 size-11"
                      aria-label={
                        filterCount ? `Filters (${filterCount})` : "Filters"
                      }
                      title="Filters"
                    />
                  }
                >
                  <FunnelSimpleIcon aria-hidden />
                  {filterCount > 0 && (
                    <span
                      aria-hidden
                      className="-top-1 -right-1 absolute bg-primary px-1 rounded-full min-w-4 h-4 text-primary-foreground text-xs"
                    >
                      {filterCount}
                    </span>
                  )}
                </DrawerTrigger>
                <Button
                  type="button"
                  variant={isSelectionMode ? "secondary" : "outline"}
                  size="icon"
                  className="p-0 size-11"
                  disabled={isPending}
                  aria-label={
                    isSelectionMode ? "Exit selection mode" : "Select media"
                  }
                  aria-pressed={isSelectionMode}
                  onClick={() =>
                    isSelectionMode
                      ? clearSelection()
                      : setIsSelectionMode(true)
                  }
                >
                  <CheckSquareIcon aria-hidden />
                </Button>
              </div>
            </div>
            <div className="hidden items-end gap-3 md:grid md:grid-cols-2 xl:grid-cols-[minmax(180px,1fr)_240px_auto] min-w-0">
              <div className="flex flex-col gap-1.5 md:col-span-2 xl:col-span-1 min-w-0">
                <span className="text-muted-foreground text-xs">Search</span>
                <div className="relative">
                  <MagnifyingGlassIcon
                    aria-hidden
                    className="top-1/2 left-3 absolute size-4 text-muted-foreground -translate-y-1/2 pointer-events-none"
                  />
                  <Input
                    ref={desktopSearchRef}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search images..."
                    aria-label="Search media"
                    className="pr-14 pl-9"
                  />
                  <Kbd className="top-1/2 right-2 absolute -translate-y-1/2">
                    ⌘ K
                  </Kbd>
                </div>
              </div>
              {renderFilters()}
              <div className="flex items-center gap-2">
                <DashboardViewToggle
                  value={viewMode}
                  onValueChange={changeView}
                />
                <Button
                  type="button"
                  variant={isSelectionMode ? "secondary" : "outline"}
                  disabled={isPending}
                  onClick={() =>
                    isSelectionMode
                      ? clearSelection()
                      : setIsSelectionMode(true)
                  }
                >
                  {isSelectionMode ? "Cancel" : "Select media"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        {uploadOpen && (
          <MediaUploadPanel
            queue={queue}
            onBrowse={browse}
            dragging={dragging}
            onClose={() => {
              if (!queue.busy) {
                setUploadOpen(false);
                uploadManual.current = false;
              }
            }}
            onViewMedia={(id) => {
              detailTriggerRef.current =
                document.activeElement instanceof HTMLElement
                  ? document.activeElement
                  : null;
              setSelectedMediaId(id);
            }}
          />
        )}
        {refined && (
          <div
            className="flex flex-wrap items-center gap-3 text-muted-foreground text-sm"
            role="status"
          >
            <span>
              {filteredMedia.length}{" "}
              {filteredMedia.length === 1 ? "image" : "images"} found
            </span>
            <Button
              type="button"
              size="sm"
              variant="link"
              className="px-0"
              onClick={clearFilters}
            >
              Clear filters and search
            </Button>
          </div>
        )}
        {isSelectionMode && (
          <div className="flex sm:flex-row flex-col sm:justify-between sm:items-start gap-3 bg-card p-3 border border-border rounded-lg">
            <div className="min-w-0">
              <p className="font-medium text-sm">
                {selectedItems.length} selected
              </p>
              <p className="text-muted-foreground text-xs">
                Up to {MEDIA_BATCH_LIMIT} images per batch.{" "}
                {outsideCount > 0 &&
                  `${outsideCount} selected outside this page.`}
              </p>
              {selectedItems.length > 0 && (
                <details className="mt-2 text-sm">
                  <summary className="cursor-pointer">
                    Review selected images
                  </summary>
                  <ul
                    aria-label="Selected images"
                    className="space-y-1 mt-2 max-h-40 overflow-y-auto"
                  >
                    {selectedItems.map((item) => (
                      <li key={item.id} className="wrap-anywhere">
                        {item.filename}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isPending || !paginatedMedia.length}
                onClick={togglePage}
              >
                {pageSelected ? "Deselect page" : "Select page"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={clearSelection}
              >
                Clear selection
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={isPending || !selectedItems.length}
                onClick={checkUsage}
              >
                {isPending ? "Checking..." : "Review deletion"}
              </Button>
            </div>
          </div>
        )}
        {!filteredMedia.length ? (
          <div className={dashboardStyles.emptyState}>
            <ImageIcon
              aria-hidden
              className="size-12 text-muted-foreground/50"
            />
            <div>
              <p className="font-medium">
                {media.length
                  ? "No images match these filters"
                  : "No media yet"}
              </p>
              <p className="mt-1 text-muted-foreground text-sm">
                {media.length
                  ? "Clear filters or try another search."
                  : "Upload your first images to get started."}
              </p>
            </div>
            {media.length ? (
              <Button type="button" variant="outline" onClick={clearFilters}>
                Clear filters and search
              </Button>
            ) : (
              <Button type="button" onClick={browse}>
                Upload images
              </Button>
            )}
          </div>
        ) : viewMode === "grid" ? (
          <div className={dashboardStyles.gridCards}>
            {paginatedMedia.map((item) => (
              <MediaCard key={item.id} {...rowProps(item)} />
            ))}
          </div>
        ) : (
          <div className={dashboardStyles.listSurface}>
            <MediaListHeader selecting={isSelectionMode} />
            <div className={dashboardStyles.listRows}>
              {paginatedMedia.map((item) => (
                <MediaListRow key={item.id} {...rowProps(item)} />
              ))}
            </div>
          </div>
        )}
        {filteredMedia.length > 0 && (
          <DashboardPagination
            firstIndex={firstIndex}
            lastIndex={lastIndex}
            total={filteredMedia.length}
            page={currentPage}
            pageCount={pageCount}
            itemsPerPage={itemsPerPage}
            itemsPerPageOptions={itemsPerPageOptions}
            onPageChange={setPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        )}
        <MediaDetailDrawer
          onDownload={downloadMedia}
          item={selectedMedia}
          returnFocus={detailTriggerRef}
          direction={drawerDirection}
          isPending={isPending}
          onClose={() => setSelectedMediaId(null)}
          onRename={onRename}
          onCopy={copy}
          onDelete={onDelete}
        >
          <MediaRenameDialog
            item={renameTarget}
            onClose={() => setRenameId(null)}
            onRenamed={(data) => {
              setMedia((previous) =>
                previous.map((item) =>
                  item.id === data.id
                    ? { ...item, filename: data.filename }
                    : item,
                ),
              );
              setRenameId(null);
              toast.add({ title: "Image renamed.", type: "success" });
            }}
          />
          <AlertDialog
            open={!!deleteTarget}
            onOpenChange={(open, details) => {
              if (!open) {
                if (actionLock.current) {
                  details.cancel();
                  return;
                }
                setDeleteId(null);
              }
            }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete media?</AlertDialogTitle>
                <AlertDialogDescription>
                  Permanently delete {deleteTarget?.filename}? Images still used
                  by content are protected. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              {actionError && (
                <p
                  role="alert"
                  className="text-destructive text-sm wrap-anywhere"
                >
                  {actionError}
                </p>
              )}
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isPending}>
                  Cancel
                </AlertDialogCancel>
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
                if (actionLock.current) {
                  details.cancel();
                  return;
                }
                setBatchOpen(false);
                setBatchPreview(null);
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
                <p
                  role="alert"
                  className="text-destructive text-sm wrap-anywhere"
                >
                  {actionError}
                </p>
              )}
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isPending}>
                  Close
                </AlertDialogCancel>
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
        </MediaDetailDrawer>
      </div>
      <DrawerContent finalFocus={filtersTriggerRef} className="p-0">
        <DrawerHeader>
          <DrawerTitle>Filters</DrawerTitle>
          <DrawerDescription>
            Choose how to order your images.
          </DrawerDescription>
        </DrawerHeader>
        <div className="gap-4 grid px-4 pb-2 max-h-[52dvh] overflow-y-auto">
          {renderFilters(true)}
          <div className="space-y-1.5">
            <p className="text-muted-foreground text-xs">View</p>
            <DashboardViewToggle
              value={draftView}
              onValueChange={setDraftView}
            />
          </div>
        </div>
        <DrawerFooter>
          <div className="gap-2 grid grid-cols-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDraftSort("date");
                setDraftDirection("desc");
              }}
            >
              Reset filters
            </Button>
            <Button type="button" onClick={applyFilters}>
              Apply filters
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
