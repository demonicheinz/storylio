"use client";

import {
  ArrowSquareOutIcon,
  CaretDownIcon,
  CaretLeftIcon,
  CaretRightIcon,
  CloudArrowUpIcon,
  CopyIcon,
  DotsThreeVerticalIcon,
  DownloadSimpleIcon,
  GridFourIcon,
  ImageIcon,
  ListBulletsIcon,
  MagnifyingGlassIcon,
  PencilSimpleIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import {
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  type ReactNode,
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import {
  DashboardSelect,
  DashboardViewToggle,
} from "@/features/dashboard/shared/components/filter-controls";
import { DashboardSummary } from "@/features/dashboard/shared/components/summary";
import { dashboardStyles } from "@/features/dashboard/shared/styles";
import { uploadFile as uploadImageFile } from "@/features/dashboard/shared/utils/upload";
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
  actionRenameMedia,
  type MediaUsagePreview,
} from "../actions";

type MediaItem = {
  id: string;
  url: string;
  publicId: string;
  filename: string;
  size: number;
  format: string;
  width: number | null;
  height: number | null;
  aspectRatio: number | null;
  blurDataUrl: string | null;
  createdAt: Date;
};

type MediaLibraryClientProps = {
  initialMedia: MediaItem[];
};

type ViewMode = "grid" | "list";
type SortMode = "newest" | "oldest" | "largest" | "smallest" | "name";

const MAX_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const sortOptions: Array<{ value: SortMode; label: string }> = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "largest", label: "Largest" },
  { value: "smallest", label: "Smallest" },
  { value: "name", label: "Name A-Z" },
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatUploadedDate(value: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getDimensions(item: MediaItem): string {
  if (!item.width || !item.height) {
    return "Unknown";
  }

  return `${item.width} × ${item.height}`;
}

function getMediaAspectRatio(item: MediaItem): number {
  if (item.aspectRatio && item.aspectRatio > 0) {
    return item.aspectRatio;
  }

  if (item.width && item.height && item.height > 0) {
    return item.width / item.height;
  }

  return 1;
}

function getFormatLabel(format: string): string {
  return format.toUpperCase();
}

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

function FormatBadge({ format }: { format: string }) {
  const normalizedFormat = format.toLowerCase();

  return (
    <Badge
      variant="secondary"
      className={cn(
        "text-xs",
        normalizedFormat === "jpg" || normalizedFormat === "jpeg"
          ? "bg-sky-500/12 text-sky-300"
          : normalizedFormat === "png"
            ? "bg-emerald-500/12 text-emerald-300"
            : normalizedFormat === "webp"
              ? "bg-fuchsia-500/12 text-fuchsia-300"
              : normalizedFormat === "gif"
                ? "bg-amber-500/12 text-amber-300"
                : "bg-muted text-muted-foreground",
      )}
    >
      {getFormatLabel(format)}
    </Badge>
  );
}

function MediaActionsMenu({
  item,
  isPending,
  onSelect,
  onRename,
  onCopy,
  onDelete,
}: {
  item: MediaItem;
  isPending: boolean;
  onSelect: (item: MediaItem) => void;
  onRename: (item: MediaItem) => void;
  onCopy: (url: string) => void;
  onDelete: (item: MediaItem) => void;
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
            variant="ghost"
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
        <DropdownMenuItem render={<a href={getMediaDownloadUrl(item)} />}>
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

function FilterDropdown<T extends string>({
  label,
  value,
  options,
  onValueChange,
}: {
  label: string;
  value: T;
  displayValue: string;
  options: Array<{ value: T; label: string }>;
  onValueChange: (value: T) => void;
}) {
  return (
    <DashboardSelect
      label={label}
      value={value}
      options={options}
      onValueChange={onValueChange}
    />
  );
}

function ViewToggle({
  viewMode,
  onViewModeChange,
}: {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}) {
  return (
    <DashboardViewToggle value={viewMode} onValueChange={onViewModeChange} />
  );
}

function MediaDetailDrawer({
  children,
  item,
  direction,
  isPending,
  onClose,
  onRename,
  onCopy,
  onDelete,
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
  returnFocus: React.RefObject<HTMLElement | null>;
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
                className="relative bg-muted/35 border border-border rounded-2xl w-full overflow-hidden"
                style={{ aspectRatio }}
              >
                <Image
                  src={item.url}
                  alt={item.filename}
                  fill
                  className="object-contain"
                  sizes={
                    direction === "right"
                      ? "384px"
                      : "(max-width: 768px) 100vw, 384px"
                  }
                />
              </div>

              <h2
                className="mt-4 font-semibold text-xl truncate leading-tight"
                title={item.filename}
              >
                {item.filename}
              </h2>
              <p className="mt-1 text-muted-foreground text-sm truncate">
                {item.publicId}
              </p>

              <div className="gap-3 grid bg-card/50 mt-4 p-3 border border-border/70 rounded-2xl">
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
                  role="link"
                  type="button"
                  variant="outline"
                  render={<a href={getMediaDownloadUrl(item)} />}
                  nativeButton={false}
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
                variant="destructive"
                className="w-full"
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
}: {
  item: MediaItem;
  isSelected: boolean;
  isSelectionMode: boolean;
  isPending: boolean;
  onSelect: (item: MediaItem) => void;
  onRename: (item: MediaItem) => void;
  onToggleSelection: (item: MediaItem) => void;
  onCopy: (url: string) => void;
  onDelete: (item: MediaItem) => void;
}) {
  return (
    <div
      className={cn(
        "group relative bg-background/45 border hover:border-brand-soft/40 focus-visible:border-ring rounded-2xl focus-visible:ring-3 focus-visible:ring-ring/30 overflow-hidden transition-colors",
        isSelectionMode ? "cursor-pointer" : "cursor-zoom-in",
        isSelected ? "border-primary/70" : "border-border/70",
      )}
    >
      <div className="relative bg-muted/35 aspect-square overflow-hidden">
        <Image
          src={item.url}
          alt={item.filename}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
        />
        <button
          type="button"
          className="absolute inset-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
          aria-label={`${isSelectionMode ? "Select" : "Preview"} ${item.filename}`}
          aria-pressed={isSelectionMode ? isSelected : undefined}
          onClick={(event) => {
            event.currentTarget.focus();
            if (isSelectionMode) onToggleSelection(item);
            else onSelect(item);
          }}
        />
        <div
          className={cn(
            "top-3 left-3 absolute transition-opacity",
            isSelectionMode || isSelected ? "opacity-100" : "hidden",
          )}
          onClick={(event) => event.stopPropagation()}
        >
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelection(item)}
            aria-label={`Select ${item.filename}`}
          />
        </div>
        <div
          className="top-3 right-3 absolute"
          onClick={(event) => event.stopPropagation()}
        >
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

      <div className="space-y-1 p-3">
        <p className="font-medium text-xs truncate" title={item.filename}>
          {item.filename}
        </p>
        <div className="flex flex-wrap items-center gap-1.5 min-w-0 text-muted-foreground text-xs">
          <FormatBadge format={item.format} />
          <span className="shrink-0">{formatBytes(item.size)}</span>
          <span aria-hidden="true">·</span>
          <span className="min-w-0 truncate">{getDimensions(item)}</span>
          <span aria-hidden="true">·</span>
          <span className="shrink-0">
            {item.blurDataUrl ? "Blur ready" : "No blur"}
          </span>
        </div>
      </div>
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
}: {
  item: MediaItem;
  isSelected: boolean;
  isSelectionMode: boolean;
  isPending: boolean;
  onSelect: (item: MediaItem) => void;
  onRename: (item: MediaItem) => void;
  onToggleSelection: (item: MediaItem) => void;
  onCopy: (url: string) => void;
  onDelete: (item: MediaItem) => void;
}) {
  return (
    <div
      className={cn(
        "flex flex-col xl:items-center gap-3 xl:grid hover:bg-muted/20 px-3 py-3 min-w-0 text-left transition-colors",
        isSelectionMode
          ? "xl:grid-cols-[24px_minmax(0,1fr)_110px_120px_130px_92px]"
          : "xl:grid-cols-[minmax(0,1fr)_110px_120px_130px_92px]",
        isSelected && "bg-primary/5",
      )}
    >
      {isSelectionMode && (
        <div
          className="flex xl:justify-center items-center"
          onClick={(event) => event.stopPropagation()}
        >
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelection(item)}
            aria-label={`Select ${item.filename}`}
          />
        </div>
      )}
      <button
        type="button"
        className="flex items-center gap-3 min-w-0 text-left"
        aria-label={`${isSelectionMode ? "Select" : "Preview"} ${item.filename}`}
        aria-pressed={isSelectionMode ? isSelected : undefined}
        onClick={(event) => {
          event.currentTarget.focus();
          if (isSelectionMode) onToggleSelection(item);
          else onSelect(item);
        }}
      >
        <div className="relative bg-muted/35 border border-border/50 rounded-xl w-20 h-14 overflow-hidden shrink-0">
          <Image
            src={item.url}
            alt={item.filename}
            fill
            className="object-cover"
            sizes="80px"
          />
        </div>
        <div className="min-w-0">
          <p className="font-medium text-sm truncate" title={item.filename}>
            {item.filename}
          </p>
          <p className="mt-1 text-muted-foreground text-xs truncate">
            {item.publicId}
          </p>
        </div>
      </button>
      <div className="hidden xl:block">
        <FormatBadge format={item.format} />
      </div>
      <div className="hidden xl:block text-muted-foreground text-sm">
        {formatBytes(item.size)}
      </div>
      <div className="hidden xl:block text-muted-foreground text-sm">
        {getDimensions(item)}
      </div>
      <div className="xl:hidden flex justify-between items-center gap-3 min-w-0">
        <div className="flex flex-wrap items-center gap-2 min-w-0 text-muted-foreground text-xs">
          <FormatBadge format={item.format} />
          <span className="shrink-0">{formatBytes(item.size)}</span>
          <span aria-hidden="true">·</span>
          <span className="min-w-0 truncate">{getDimensions(item)}</span>
        </div>
        <div className="shrink-0" onClick={(event) => event.stopPropagation()}>
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
      <div
        className="hidden xl:flex justify-end xl:justify-end gap-1"
        onClick={(e) => e.stopPropagation()}
      >
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

function MediaPagination({
  firstIndex,
  lastIndex,
  total,
  page,
  pageCount,
  itemsPerPage,
  itemsPerPageOptions,
  onPageChange,
  onItemsPerPageChange,
}: {
  firstIndex: number;
  lastIndex: number;
  total: number;
  page: number;
  pageCount: number;
  itemsPerPage: number;
  itemsPerPageOptions: readonly number[];
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (value: number) => void;
}) {
  const pageControls = (
    <div className="flex justify-center items-center gap-1">
      <Button
        type="button"
        size="icon"
        variant="outline"
        disabled={page <= 1}
        onClick={() => onPageChange(Math.max(1, page - 1))}
        aria-label="Previous page"
      >
        <CaretLeftIcon />
      </Button>
      {Array.from({ length: pageCount }).map((_, index) => {
        const pageNumber = index + 1;

        return (
          <Button
            key={pageNumber}
            type="button"
            size="icon"
            variant={pageNumber === page ? "default" : "outline"}
            onClick={() => onPageChange(pageNumber)}
            aria-current={pageNumber === page ? "page" : undefined}
          >
            {pageNumber}
          </Button>
        );
      })}
      <Button
        type="button"
        size="icon"
        variant="outline"
        disabled={page >= pageCount}
        onClick={() => onPageChange(Math.min(pageCount, page + 1))}
        aria-label="Next page"
      >
        <CaretRightIcon />
      </Button>
    </div>
  );

  return (
    <div className="md:items-center gap-3 grid md:grid-cols-[1fr_auto_1fr] mt-4 text-muted-foreground text-sm">
      <div className="md:contents flex justify-between items-center">
        <p className="md:hidden">
          {firstIndex}-{lastIndex} of {total}
        </p>
        <p className="hidden md:block">
          Showing {firstIndex} to {lastIndex} of {total}{" "}
          {total === 1 ? "item" : "items"}
        </p>
        <div className="md:hidden">
          <MediaItemsPerPageDropdown
            value={itemsPerPage}
            options={itemsPerPageOptions}
            onValueChange={onItemsPerPageChange}
          />
        </div>
      </div>
      <div className="md:col-start-2">{pageControls}</div>
      <div className="hidden md:flex justify-end">
        <MediaItemsPerPageDropdown
          value={itemsPerPage}
          options={itemsPerPageOptions}
          onValueChange={onItemsPerPageChange}
          showLabel
        />
      </div>
    </div>
  );
}

function MediaItemsPerPageDropdown({
  value,
  options,
  onValueChange,
  showLabel = false,
}: {
  value: number;
  options: readonly number[];
  onValueChange: (value: number) => void;
  showLabel?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      {showLabel && (
        <span className="text-muted-foreground text-sm">Items per page</span>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button type="button" variant="outline" size="sm" />}
        >
          {value}
          <CaretDownIcon className="size-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-24">
          <DropdownMenuRadioGroup
            value={String(value)}
            onValueChange={(nextValue) => onValueChange(Number(nextValue))}
          >
            {options.map((option) => (
              <DropdownMenuRadioItem
                key={option}
                value={String(option)}
                closeOnClick={true}
              >
                {option}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function MediaLibraryClient({ initialMedia }: MediaLibraryClientProps) {
  const detailTriggerRef = useRef<HTMLElement | null>(null);
  const [media, setMedia] = useState(initialMedia);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [query, setQuery] = useState("");
  const [format, setFormat] = useState("all");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [itemsPerPage, setItemsPerPage] = useState<number>(
    getDefaultItemsPerPage("grid"),
  );
  const [page, setPage] = useState(1);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [renameTarget, setRenameTarget] = useState<MediaItem | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<MediaItem | null>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchPreview, setBatchPreview] = useState<MediaUsagePreview | null>(
    null,
  );
  const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false);
  const [drawerDirection, setDrawerDirection] = useState<"down" | "right">(
    "down",
  );
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");

    const syncDrawerDirection = () => {
      setDrawerDirection(mediaQuery.matches ? "right" : "down");
    };

    syncDrawerDirection();
    mediaQuery.addEventListener("change", syncDrawerDirection);

    return () => mediaQuery.removeEventListener("change", syncDrawerDirection);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() !== "k" ||
        !(event.ctrlKey || event.metaKey)
      ) {
        return;
      }

      event.preventDefault();
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const uploadFile = useCallback(async (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.add({
        title: "Invalid file type. Use jpg, png, webp, or gif.",
        type: "error",
      });
      return;
    }

    if (file.size > MAX_SIZE) {
      toast.add({ title: "File too large. Maximum 10MB.", type: "error" });
      return;
    }

    setIsUploading(true);
    try {
      const data = await uploadImageFile(file);
      setMedia((prev) => [
        {
          id: data.id,
          url: data.url,
          publicId: data.publicId,
          filename: data.filename,
          size: data.size,
          format: data.format,
          width: data.width ?? null,
          height: data.height ?? null,
          aspectRatio: data.aspectRatio ?? null,
          blurDataUrl: data.blurDataUrl ?? null,
          createdAt: new Date(),
        },
        ...prev,
      ]);
      toast.add({ title: "Image uploaded successfully", type: "success" });
    } catch (err) {
      toast.add({
        title: err instanceof Error ? err.message : "Upload failed",
        type: "error",
      });
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (isUploading) return;
      if (files.length > 1) {
        toast.add({ title: "Upload one image at a time.", type: "error" });
        return;
      }
      if (files.length > 0) {
        uploadFile(files[0]);
      }
    },
    [uploadFile, isUploading],
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        uploadFile(file);
      }
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
    [uploadFile],
  );

  const handleCopyUrl = useCallback((url: string) => {
    navigator.clipboard.writeText(url);
    toast.add({ title: "URL copied to clipboard", type: "success" });
  }, []);

  const scheduleOverlayOpen = useCallback((open: () => void) => {
    const schedule =
      typeof requestAnimationFrame === "function"
        ? requestAnimationFrame
        : (callback: FrameRequestCallback) => window.setTimeout(callback, 0);

    schedule(open);
  }, []);

  const openMediaDetails = useCallback(
    (item: MediaItem) => {
      detailTriggerRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      scheduleOverlayOpen(() => setSelectedMedia(item));
    },
    [scheduleOverlayOpen],
  );

  const openDeleteDialog = useCallback(
    (item: MediaItem) => {
      scheduleOverlayOpen(() => setDeleteTarget(item));
    },
    [scheduleOverlayOpen],
  );

  const openRenameDialog = useCallback(
    (item: MediaItem) => {
      scheduleOverlayOpen(() => {
        setRenameTarget(item);
        setRenameValue(item.filename);
      });
    },
    [scheduleOverlayOpen],
  );

  const closeRenameDialog = useCallback(() => {
    setRenameTarget(null);
    setRenameValue("");
  }, []);

  const handleRename = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!renameTarget) {
        return;
      }

      const mediaId = renameTarget.id;
      const nextFilename = renameValue.trim();

      startTransition(async () => {
        const result = await actionRenameMedia(mediaId, nextFilename);

        if (result.success) {
          const filename = result.data?.filename ?? nextFilename;

          setMedia((prev) =>
            prev.map((item) =>
              item.id === mediaId ? { ...item, filename } : item,
            ),
          );
          setSelectedMedia((current) =>
            current?.id === mediaId ? { ...current, filename } : current,
          );
          setDeleteTarget((current) =>
            current?.id === mediaId ? { ...current, filename } : current,
          );
          closeRenameDialog();
          toast.add({ title: "Media renamed", type: "success" });
        } else {
          toast.add({ title: result.error, type: "error" });
        }
      });
    },
    [closeRenameDialog, renameTarget, renameValue],
  );

  const toggleMediaSelection = useCallback((item: MediaItem) => {
    setSelectedIds((current) => {
      const next = new Set(current);

      if (next.has(item.id)) {
        next.delete(item.id);
      } else {
        next.add(item.id);
        setIsSelectionMode(true);
      }

      if (next.size === 0) {
        setIsSelectionMode(false);
      }

      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setIsSelectionMode(false);
    setBatchPreview(null);
    setIsBatchDialogOpen(false);
  }, []);

  const handleBatchDeletePreview = useCallback(() => {
    const ids = Array.from(selectedIds);

    if (ids.length === 0) {
      toast.add({ title: "Select media to delete first", type: "error" });
      return;
    }

    startTransition(async () => {
      const result = await actionCheckMediaUsage(ids);

      if (result.success) {
        setBatchPreview(result.data ?? { canDelete: [], blocked: [] });
        setIsBatchDialogOpen(true);
      } else {
        toast.add({ title: result.error, type: "error" });
      }
    });
  }, [selectedIds]);

  const handleBatchDelete = useCallback(() => {
    const deleteIds = batchPreview?.canDelete.map((item) => item.id) ?? [];

    if (deleteIds.length === 0) {
      return;
    }

    startTransition(async () => {
      const result = await actionDeleteMediaBatch(deleteIds);

      if (result.success) {
        const deletedIds = new Set(result.data?.deletedIds ?? deleteIds);
        setMedia((prev) => prev.filter((item) => !deletedIds.has(item.id)));
        setSelectedIds((current) => {
          const next = new Set(current);
          for (const id of deletedIds) {
            next.delete(id);
          }
          return next;
        });
        setSelectedMedia((current) =>
          current && deletedIds.has(current.id) ? null : current,
        );
        setBatchPreview(null);
        setIsBatchDialogOpen(false);
        setIsSelectionMode(false);
        toast.add({
          title: `${deletedIds.size} media deleted`,
          type: "success",
        });
      } else {
        toast.add({ title: result.error, type: "error" });
      }
    });
  }, [batchPreview]);

  const handleDelete = useCallback(() => {
    if (!deleteTarget) return;

    const targetId = deleteTarget.id;
    startTransition(async () => {
      const result = await actionDeleteMedia(targetId);
      if (result.success) {
        setMedia((prev) => prev.filter((m) => m.id !== targetId));
        setSelectedIds((current) => {
          const next = new Set(current);
          next.delete(targetId);
          if (next.size === 0) {
            setIsSelectionMode(false);
          }
          return next;
        });
        setSelectedMedia((current) =>
          current?.id === targetId ? null : current,
        );
        toast.add({ title: "Media deleted", type: "success" });
      } else {
        toast.add({ title: result.error, type: "error" });
      }
      setDeleteTarget(null);
    });
  }, [deleteTarget]);

  const stats = useMemo(() => {
    const totalSize = media.reduce((sum, item) => sum + item.size, 0);
    const optimized = media.filter(
      (item) => item.width && item.height && item.blurDataUrl,
    ).length;
    const largeFiles = media.filter(
      (item) => item.size > 2 * 1024 * 1024,
    ).length;

    return {
      total: media.length,
      totalSize,
      optimized,
      largeFiles,
    };
  }, [media]);

  const formats = useMemo(
    () =>
      Array.from(new Set(media.map((item) => item.format.toLowerCase()))).sort(
        (a, b) => a.localeCompare(b),
      ),
    [media],
  );

  const filteredMedia = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return [...media]
      .filter((item) => {
        if (format !== "all" && item.format.toLowerCase() !== format) {
          return false;
        }

        if (!normalizedQuery) {
          return true;
        }

        return [item.filename, item.publicId, item.format].some((value) =>
          value.toLowerCase().includes(normalizedQuery),
        );
      })
      .sort((a, b) => {
        if (sortMode === "oldest") {
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        }

        if (sortMode === "largest") {
          return b.size - a.size;
        }

        if (sortMode === "smallest") {
          return a.size - b.size;
        }

        if (sortMode === "name") {
          return a.filename.localeCompare(b.filename);
        }

        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
  }, [format, media, query, sortMode]);

  const {
    items: paginatedMedia,
    pageCount,
    currentPage,
    firstIndex,
    lastIndex,
  } = paginateItems(filteredMedia, page, itemsPerPage);
  const itemsPerPageOptions = getItemsPerPageOptions(viewMode);

  useEffect(() => {
    setPage(1);
  }, [format, itemsPerPage, query, sortMode]);

  const handleViewModeChange = (nextViewMode: ViewMode) => {
    setViewMode(nextViewMode);
    setItemsPerPage(getDefaultItemsPerPage(nextViewMode));
  };

  const handleSelectAllFiltered = useCallback(() => {
    setIsSelectionMode(true);
    setSelectedIds(new Set(filteredMedia.map((item) => item.id)));
  }, [filteredMedia]);

  const formatDisplay =
    format === "all" ? "All formats" : getFormatLabel(format);
  const sortDisplay =
    sortOptions.find((option) => option.value === sortMode)?.label ?? "Newest";
  const selectedCount = selectedIds.size;
  const canDeleteCount = batchPreview?.canDelete.length ?? 0;
  const blockedCount = batchPreview?.blocked.length ?? 0;

  return (
    <div className={dashboardStyles.page}>
      <div className="flex justify-between items-start gap-4">
        <div className="min-w-0">
          <h1 className="font-heading font-bold text-3xl">Media Library</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground text-sm leading-6">
            Upload, inspect, copy, and manage image assets used across Storylio.
          </p>
        </div>
        <Button
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="md:px-4 md:w-auto shrink-0"
        >
          <CloudArrowUpIcon data-icon="inline-start" />
          <span>Upload</span>
        </Button>
      </div>

      <DashboardSummary
        items={[
          { label: "Images", value: stats.total },
          { label: "Storage", value: formatBytes(stats.totalSize) },
        ]}
      />

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileSelect}
        disabled={isUploading}
      />

      <Card className={dashboardStyles.toolbarCard}>
        <CardContent className={dashboardStyles.toolbarContent}>
          <div className="xl:items-center gap-3 grid xl:grid-cols-[minmax(240px,1fr)_auto]">
            <div className="relative min-w-0">
              <MagnifyingGlassIcon className="top-1/2 left-3 absolute size-4 text-muted-foreground -translate-y-1/2 pointer-events-none" />
              <Input
                ref={searchInputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search media..."
                className="pr-14 pl-9"
                aria-label="Search media"
              />
              <Kbd className="top-1/2 right-2 absolute -translate-y-1/2">
                ⌘ K
              </Kbd>
            </div>
            <div className="items-center gap-2 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] min-w-0">
              <div className="min-w-0">
                <FilterDropdown
                  label="Format"
                  value={format}
                  displayValue={formatDisplay}
                  options={[
                    { value: "all", label: "All formats" },
                    ...formats.map((itemFormat) => ({
                      value: itemFormat,
                      label: getFormatLabel(itemFormat),
                    })),
                  ]}
                  onValueChange={setFormat}
                />
              </div>
              <div className="min-w-0">
                <FilterDropdown
                  label="Sort by"
                  value={sortMode}
                  displayValue={sortDisplay}
                  options={sortOptions}
                  onValueChange={setSortMode}
                />
              </div>
              <ViewToggle
                viewMode={viewMode}
                onViewModeChange={handleViewModeChange}
              />
            </div>
            {!isSelectionMode && media.length > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSelectionMode(true)}
                disabled={filteredMedia.length === 0}
              >
                Select media
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className={dashboardStyles.toolbarCard}>
        <CardContent className={dashboardStyles.toolbarContent}>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => !isUploading && inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (!isUploading) inputRef.current?.click();
              }
            }}
            className={cn(
              "flex items-center gap-3 mb-4 p-3 border border-dashed rounded-xl transition-colors cursor-pointer",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 hover:bg-muted/20",
              isUploading && "pointer-events-none opacity-50",
            )}
            role="button"
            tabIndex={0}
          >
            {isUploading ? (
              <>
                <CloudArrowUpIcon className="size-8 text-primary animate-pulse" />
                <p className="text-muted-foreground text-sm">Uploading...</p>
              </>
            ) : (
              <>
                <CloudArrowUpIcon className="size-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="font-medium text-sm">Upload one image</p>
                  <p className="mt-1 text-muted-foreground text-xs">
                    Drop here or choose a file. JPG, PNG, WebP, GIF · max 10MB
                  </p>
                </div>
              </>
            )}
          </div>

          {media.length > 0 && isSelectionMode && (
            <div className="flex md:flex-row flex-col md:justify-between md:items-center gap-3 bg-background/35 mb-4 p-3 border border-border/70 rounded-2xl">
              <div className="min-w-0">
                <p className="font-medium text-sm">
                  {isSelectionMode
                    ? `${selectedCount} selected`
                    : "Batch actions"}
                </p>
                <p className="mt-0.5 text-muted-foreground text-xs">
                  Select media first. Delete checks usage before removing files.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {isSelectionMode ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAllFiltered}
                      disabled={filteredMedia.length === 0 || isPending}
                    >
                      Select all
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={clearSelection}
                      disabled={isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handleBatchDeletePreview}
                      disabled={selectedCount === 0 || isPending}
                    >
                      Delete selected
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsSelectionMode(true)}
                    disabled={filteredMedia.length === 0}
                  >
                    Select media
                  </Button>
                )}
              </div>
            </div>
          )}

          {media.length === 0 ? (
            <div className={dashboardStyles.emptyState}>
              <ImageIcon className="size-16 text-muted-foreground/40" />
              <p className="font-medium">No media uploaded yet</p>
              <p className="text-muted-foreground text-sm">
                Upload your first image to get started.
              </p>
            </div>
          ) : filteredMedia.length === 0 ? (
            <div className={dashboardStyles.emptyState}>
              <MagnifyingGlassIcon className="size-12 text-muted-foreground/50" />
              <p className="font-medium">No media found</p>
              <p className="text-muted-foreground text-sm">
                Adjust search or format filters.
              </p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="gap-4 grid sm:grid-cols-2 xl:grid-cols-4">
              {paginatedMedia.map((item) => (
                <MediaCard
                  key={item.id}
                  item={item}
                  isSelected={selectedIds.has(item.id)}
                  isSelectionMode={isSelectionMode}
                  isPending={isPending}
                  onSelect={openMediaDetails}
                  onRename={openRenameDialog}
                  onToggleSelection={toggleMediaSelection}
                  onCopy={handleCopyUrl}
                  onDelete={openDeleteDialog}
                />
              ))}
            </div>
          ) : (
            <div className={dashboardStyles.listSurface}>
              <div
                className={cn(
                  "hidden xl:grid",
                  isSelectionMode
                    ? "grid-cols-[24px_minmax(0,1fr)_110px_120px_130px_92px]"
                    : "grid-cols-[minmax(0,1fr)_110px_120px_130px_92px]",
                  dashboardStyles.listHeader,
                )}
              >
                {isSelectionMode && <div />}
                <div>Name</div>
                <div>Type</div>
                <div>Size</div>
                <div>Dimensions</div>
                <div className="text-right">Actions</div>
              </div>
              <div className={dashboardStyles.listRows}>
                {paginatedMedia.map((item) => (
                  <MediaListRow
                    key={item.id}
                    item={item}
                    isSelected={selectedIds.has(item.id)}
                    isSelectionMode={isSelectionMode}
                    isPending={isPending}
                    onSelect={openMediaDetails}
                    onRename={openRenameDialog}
                    onToggleSelection={toggleMediaSelection}
                    onCopy={handleCopyUrl}
                    onDelete={openDeleteDialog}
                  />
                ))}
              </div>
            </div>
          )}

          {filteredMedia.length > 0 && (
            <MediaPagination
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
        </CardContent>
      </Card>

      <MediaDetailDrawer
        returnFocus={detailTriggerRef}
        item={selectedMedia}
        direction={drawerDirection}
        isPending={isPending}
        onClose={() => setSelectedMedia(null)}
        onRename={openRenameDialog}
        onCopy={handleCopyUrl}
        onDelete={openDeleteDialog}
      >
        <Dialog
          open={!!renameTarget}
          onOpenChange={(open) => {
            if (!open) {
              closeRenameDialog();
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename media</DialogTitle>
              <DialogDescription>
                Update the library file name. This does not rename the
                Cloudinary asset or change the image URL.
              </DialogDescription>
            </DialogHeader>
            <form
              id="media-rename-form"
              className="space-y-2"
              onSubmit={handleRename}
            >
              <Label htmlFor="media-filename">File name</Label>
              <Input
                id="media-filename"
                value={renameValue}
                onChange={(event) => setRenameValue(event.target.value)}
                maxLength={160}
                autoFocus
              />
            </form>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeRenameDialog}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="media-rename-form"
                disabled={isPending || renameValue.trim().length === 0}
              >
                {isPending ? "Saving..." : "Save name"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog
          open={isBatchDialogOpen}
          onOpenChange={(open: boolean) => {
            setIsBatchDialogOpen(open);
            if (!open) {
              setBatchPreview(null);
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete selected media?</AlertDialogTitle>
              <AlertDialogDescription>
                Storylio checked where each selected image is used. Media still
                referenced by content will be skipped until those references are
                removed.
              </AlertDialogDescription>
            </AlertDialogHeader>

            {batchPreview && (
              <div className="space-y-4">
                <div className="gap-3 grid grid-cols-2">
                  <div className="bg-emerald-500/10 p-3 border border-emerald-500/20 rounded-2xl">
                    <p className="font-heading font-bold text-emerald-300 text-2xl">
                      {canDeleteCount}
                    </p>
                    <p className="text-emerald-100/80 text-xs">Can delete</p>
                  </div>
                  <div className="bg-amber-500/10 p-3 border border-amber-500/20 rounded-2xl">
                    <p className="font-heading font-bold text-amber-300 text-2xl">
                      {blockedCount}
                    </p>
                    <p className="text-amber-100/80 text-xs">Still in use</p>
                  </div>
                </div>

                {batchPreview.blocked.length > 0 && (
                  <div className="space-y-2 bg-background/35 p-3 border border-border/70 rounded-2xl max-h-48 overflow-y-auto scrollbar-none">
                    {batchPreview.blocked.map((item) => (
                      <div key={item.id} className="min-w-0 text-sm">
                        <p
                          className="font-medium truncate"
                          title={item.filename}
                        >
                          {item.filename}
                        </p>
                        <p className="mt-1 text-muted-foreground text-xs">
                          Used by {formatReferenceSummary(item.references)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleBatchDelete}
                disabled={isPending || canDeleteCount === 0}
                variant="destructive"
              >
                {isPending
                  ? "Deleting..."
                  : canDeleteCount > 0
                    ? `Delete ${canDeleteCount} media`
                    : "Nothing to delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={!!deleteTarget}
          onOpenChange={(open: boolean) => {
            if (!open) setDeleteTarget(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete media?</AlertDialogTitle>
              <AlertDialogDescription>
                If this image is not used by CMS content, this will permanently
                delete{" "}
                <span className="font-medium text-foreground">
                  {deleteTarget?.filename}
                </span>{" "}
                from Cloudinary and the database. Images still in use cannot be
                deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isPending}
                variant="destructive"
              >
                {isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </MediaDetailDrawer>
    </div>
  );
}
