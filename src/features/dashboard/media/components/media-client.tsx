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
import { toast } from "sonner";
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
        "text-[10px]",
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
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="size-8 rounded-xl bg-background/70 text-foreground backdrop-blur hover:bg-background"
          aria-label={`Open actions for ${item.filename}`}
        >
          <DotsThreeVerticalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onSelect={() => onSelect(item)}>
          <ImageIcon data-icon="inline-start" />
          Details
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onRename(item)}>
          <PencilSimpleIcon data-icon="inline-start" />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onCopy(item.url)}>
          <CopyIcon data-icon="inline-start" />
          Copy URL
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={item.url} target="_blank" rel="noreferrer">
            <ArrowSquareOutIcon data-icon="inline-start" />
            View
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={getMediaDownloadUrl(item)}>
            <DownloadSimpleIcon data-icon="inline-start" />
            Download
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={isPending}
          onSelect={() => onDelete(item)}
        >
          <TrashIcon data-icon="inline-start" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MediaStatCard({
  label,
  value,
  description,
  icon,
  iconClassName,
}: {
  label: string;
  value: string | number;
  description: string;
  icon: ReactNode;
  iconClassName: string;
}) {
  return (
    <Card className={dashboardStyles.statCard}>
      <CardContent className={dashboardStyles.statContent}>
        <div className={cn(dashboardStyles.statIcon, iconClassName)}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="font-heading text-xl font-bold">{value}</p>
          <p className="text-[11px] text-muted-foreground">{label}</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground/80">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function FilterDropdown<T extends string>({
  label,
  value,
  displayValue,
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full min-w-0 justify-between rounded-2xl bg-input/35 px-3"
        >
          <span className="min-w-0 text-left">
            <span className="block text-[10px] leading-none text-muted-foreground">
              {label}
            </span>
            <span className="mt-1 block truncate text-xs font-medium">
              {displayValue}
            </span>
          </span>
          <CaretDownIcon className="ml-2 size-3.5 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(nextValue) => onValueChange(nextValue as T)}
        >
          {options.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
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
    <div className="grid w-fit shrink-0 grid-cols-2 justify-self-end rounded-xl border border-border/60 bg-background/35 p-1">
      <Button
        type="button"
        size="icon"
        variant={viewMode === "grid" ? "default" : "ghost"}
        className="size-8 rounded-lg"
        onClick={() => onViewModeChange("grid")}
        aria-label="Grid view"
        aria-pressed={viewMode === "grid"}
      >
        <GridFourIcon />
      </Button>
      <Button
        type="button"
        size="icon"
        variant={viewMode === "list" ? "default" : "ghost"}
        className="size-8 rounded-lg"
        onClick={() => onViewModeChange("list")}
        aria-label="List view"
        aria-pressed={viewMode === "list"}
      >
        <ListBulletsIcon />
      </Button>
    </div>
  );
}

function MediaDetailDrawer({
  item,
  direction,
  isPending,
  onClose,
  onRename,
  onCopy,
  onDelete,
}: {
  item: MediaItem | null;
  direction: "bottom" | "right";
  isPending: boolean;
  onClose: () => void;
  onRename: (item: MediaItem) => void;
  onCopy: (url: string) => void;
  onDelete: (item: MediaItem) => void;
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
      direction={direction}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DrawerContent
        className={cn(
          "overflow-hidden p-0",
          direction === "right"
            ? "h-dvh before:inset-y-0! before:right-0! before:left-0! before:rounded-l-4xl! before:rounded-r-none!"
            : "max-h-[86vh] before:inset-x-0! before:top-2! before:bottom-0! before:rounded-b-none!",
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
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 scrollbar-none overflow-y-auto px-4 pt-7 pb-4">
              <div
                className="relative w-full overflow-hidden rounded-2xl border border-border bg-muted/35"
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
                className="mt-4 truncate font-heading text-xl leading-tight font-semibold"
                title={item.filename}
              >
                {item.filename}
              </h2>
              <p className="mt-1 truncate text-sm text-muted-foreground">
                {item.publicId}
              </p>

              <div className="mt-4 grid gap-3 rounded-2xl border border-border/70 bg-card/50 p-3">
                {metadata.map((row) => (
                  <div
                    key={row.label}
                    className="grid grid-cols-[96px_minmax(0,1fr)] gap-3 text-sm"
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
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onRename(item)}
                >
                  <PencilSimpleIcon data-icon="inline-start" />
                  Rename
                </Button>
                <Button type="button" variant="outline" asChild>
                  <a href={getMediaDownloadUrl(item)}>
                    <DownloadSimpleIcon data-icon="inline-start" />
                    Download
                  </a>
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
                type="button"
                variant="outline"
                className="w-full"
                asChild
              >
                <a href={item.url} target="_blank" rel="noreferrer">
                  <ArrowSquareOutIcon data-icon="inline-start" />
                  View
                </a>
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
        "group relative overflow-hidden rounded-2xl border bg-background/45 transition-colors hover:border-brand-soft/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30",
        isSelectionMode ? "cursor-pointer" : "cursor-zoom-in",
        isSelected ? "border-primary/70" : "border-border/70",
      )}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      onClick={() => {
        if (isSelectionMode) {
          onToggleSelection(item);
          return;
        }

        onSelect(item);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          if (isSelectionMode) {
            onToggleSelection(item);
            return;
          }

          onSelect(item);
        }
      }}
    >
      <div className="relative aspect-square overflow-hidden bg-muted/35">
        <Image
          src={item.url}
          alt={item.filename}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
        />
        <div
          className={cn(
            "absolute top-3 left-3 transition-opacity",
            isSelectionMode || isSelected
              ? "opacity-100"
              : "opacity-0 group-hover:opacity-100",
          )}
          onClick={(event) => event.stopPropagation()}
        >
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelection(item)}
            aria-label={`Select ${item.filename}`}
            className="border-border/70 bg-background/80 backdrop-blur"
          />
        </div>
        <div
          className="absolute top-3 right-3 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
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
        <p className="truncate text-xs font-medium" title={item.filename}>
          {item.filename}
        </p>
        <div className="flex min-w-0 items-center gap-1.5 text-[10px] text-muted-foreground">
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
        "flex min-w-0 flex-col gap-3 px-3 py-3 text-left transition-colors hover:bg-muted/20 xl:grid xl:items-center",
        isSelectionMode
          ? "xl:grid-cols-[24px_minmax(0,1fr)_110px_120px_130px_92px]"
          : "xl:grid-cols-[minmax(0,1fr)_110px_120px_130px_92px]",
        isSelected && "bg-primary/5",
      )}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      onClick={() => {
        if (isSelectionMode) {
          onToggleSelection(item);
          return;
        }

        onSelect(item);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          if (isSelectionMode) {
            onToggleSelection(item);
            return;
          }

          onSelect(item);
        }
      }}
    >
      {isSelectionMode && (
        <div
          className="flex items-center xl:justify-center"
          onClick={(event) => event.stopPropagation()}
        >
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelection(item)}
            aria-label={`Select ${item.filename}`}
          />
        </div>
      )}
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-xl border border-border/50 bg-muted/35">
          <Image
            src={item.url}
            alt={item.filename}
            fill
            className="object-cover"
            sizes="80px"
          />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium" title={item.filename}>
            {item.filename}
          </p>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {item.publicId}
          </p>
        </div>
      </div>
      <div className="hidden xl:block">
        <FormatBadge format={item.format} />
      </div>
      <div className="hidden text-sm text-muted-foreground xl:block">
        {formatBytes(item.size)}
      </div>
      <div className="hidden text-sm text-muted-foreground xl:block">
        {getDimensions(item)}
      </div>
      <div className="flex min-w-0 items-center justify-between gap-3 xl:hidden">
        <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-muted-foreground">
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
        className="hidden justify-end gap-1 xl:flex xl:justify-end"
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
    <div className="flex items-center justify-center gap-1">
      <Button
        type="button"
        size="icon"
        variant="outline"
        className="size-8 rounded-xl"
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
            className="size-8 rounded-xl"
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
        className="size-8 rounded-xl"
        disabled={page >= pageCount}
        onClick={() => onPageChange(Math.min(pageCount, page + 1))}
        aria-label="Next page"
      >
        <CaretRightIcon />
      </Button>
    </div>
  );

  return (
    <div className="mt-4 grid gap-3 text-sm text-muted-foreground md:grid-cols-[1fr_auto_1fr] md:items-center">
      <div className="flex items-center justify-between md:contents">
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
      <div className="hidden justify-end md:flex">
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
        <span className="text-sm text-muted-foreground">Items per page</span>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl bg-input/35"
          >
            {value}
            <CaretDownIcon className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-24">
          <DropdownMenuRadioGroup
            value={String(value)}
            onValueChange={(nextValue) => onValueChange(Number(nextValue))}
          >
            {options.map((option) => (
              <DropdownMenuRadioItem key={option} value={String(option)}>
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
  const [drawerDirection, setDrawerDirection] = useState<"bottom" | "right">(
    "bottom",
  );
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");

    const syncDrawerDirection = () => {
      setDrawerDirection(mediaQuery.matches ? "right" : "bottom");
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
      toast.error("Invalid file type. Use jpg, png, webp, or gif.");
      return;
    }

    if (file.size > MAX_SIZE) {
      toast.error("File too large. Maximum 10MB.");
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
      toast.success("Image uploaded successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        uploadFile(files[0]);
      }
    },
    [uploadFile],
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
    toast.success("URL copied to clipboard");
  }, []);

  const blurActiveElementBeforeOpen = useCallback((open: () => void) => {
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) {
      activeElement.blur();
    }

    const schedule =
      typeof requestAnimationFrame === "function"
        ? requestAnimationFrame
        : (callback: FrameRequestCallback) => window.setTimeout(callback, 0);

    schedule(open);
  }, []);

  const openMediaDetails = useCallback(
    (item: MediaItem) => {
      blurActiveElementBeforeOpen(() => setSelectedMedia(item));
    },
    [blurActiveElementBeforeOpen],
  );

  const openDeleteDialog = useCallback(
    (item: MediaItem) => {
      blurActiveElementBeforeOpen(() => setDeleteTarget(item));
    },
    [blurActiveElementBeforeOpen],
  );

  const openRenameDialog = useCallback(
    (item: MediaItem) => {
      blurActiveElementBeforeOpen(() => {
        setRenameTarget(item);
        setRenameValue(item.filename);
      });
    },
    [blurActiveElementBeforeOpen],
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
          toast.success("Media renamed");
        } else {
          toast.error(result.error);
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
      toast.error("Select media to delete first");
      return;
    }

    startTransition(async () => {
      const result = await actionCheckMediaUsage(ids);

      if (result.success) {
        setBatchPreview(result.data ?? { canDelete: [], blocked: [] });
        setIsBatchDialogOpen(true);
      } else {
        toast.error(result.error);
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
        toast.success(`${deletedIds.size} media deleted`);
      } else {
        toast.error(result.error);
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
        toast.success("Media deleted");
      } else {
        toast.error(result.error);
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
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-heading text-3xl font-bold">Media Library</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Upload, inspect, copy, and manage image assets used across Storylio.
          </p>
        </div>
        <Button
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          size="icon"
          className="size-10 shrink-0 rounded-full md:h-9 md:w-auto md:rounded-3xl md:px-4"
        >
          <CloudArrowUpIcon data-icon="inline-start" />
          <span className="sr-only md:not-sr-only">Upload</span>
        </Button>
      </div>

      <div className={dashboardStyles.statGrid}>
        <MediaStatCard
          label="Total Images"
          value={stats.total}
          description="Stored in Cloudinary"
          icon={<ImageIcon />}
          iconClassName="bg-sky-500/12 text-sky-300"
        />
        <MediaStatCard
          label="Storage Used"
          value={formatBytes(stats.totalSize)}
          description="Original uploaded size"
          icon={<CloudArrowUpIcon />}
          iconClassName="bg-emerald-500/12 text-emerald-300"
        />
        <MediaStatCard
          label="Optimized Metadata"
          value={`${stats.optimized}/${stats.total}`}
          description="Dimensions and blur ready"
          icon={<CopyIcon />}
          iconClassName="bg-fuchsia-500/12 text-fuchsia-300"
        />
        <MediaStatCard
          label="Large Files"
          value={stats.largeFiles}
          description="Larger than 2MB"
          icon={<DownloadSimpleIcon />}
          iconClassName="bg-amber-500/12 text-amber-300"
        />
      </div>

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
          <div className="grid gap-3 xl:grid-cols-[minmax(240px,1fr)_auto] xl:items-center">
            <div className="relative min-w-0">
              <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search media..."
                className="h-11 rounded-2xl bg-input/45 pr-14 pl-9"
                aria-label="Search media"
              />
              <Kbd className="absolute top-1/2 right-2 -translate-y-1/2 border border-border/50 bg-background/60">
                ⌘ K
              </Kbd>
            </div>
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-2">
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
              "mb-4 hidden cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed p-5 transition-all duration-200 md:flex",
              isDragging
                ? "border-primary bg-primary/5 shadow-[0_0_24px_-4px] shadow-primary/20"
                : "border-border hover:border-primary/50 hover:bg-muted/20",
              isUploading && "pointer-events-none opacity-50",
            )}
            role="button"
            tabIndex={0}
          >
            {isUploading ? (
              <>
                <CloudArrowUpIcon className="size-8 animate-pulse text-primary" />
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </>
            ) : (
              <>
                <ImageIcon className="size-8 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm font-medium">
                    Drop an image here or click to upload
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    JPG, PNG, WebP, GIF — max 10MB
                  </p>
                </div>
              </>
            )}
          </div>

          {media.length > 0 && (
            <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-border/70 bg-background/35 p-3 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {isSelectionMode
                    ? `${selectedCount} selected`
                    : "Batch actions"}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
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
              <p className="text-sm text-muted-foreground">
                Upload your first image to get started.
              </p>
            </div>
          ) : filteredMedia.length === 0 ? (
            <div className={dashboardStyles.emptyState}>
              <MagnifyingGlassIcon className="size-12 text-muted-foreground/50" />
              <p className="font-medium">No media found</p>
              <p className="text-sm text-muted-foreground">
                Adjust search or format filters.
              </p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
        item={selectedMedia}
        direction={drawerDirection}
        isPending={isPending}
        onClose={() => setSelectedMedia(null)}
        onRename={openRenameDialog}
        onCopy={handleCopyUrl}
        onDelete={openDeleteDialog}
      />

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
              Update the library file name. This does not rename the Cloudinary
              asset or change the image URL.
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
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                  <p className="font-heading text-2xl font-bold text-emerald-300">
                    {canDeleteCount}
                  </p>
                  <p className="text-xs text-emerald-100/80">Can delete</p>
                </div>
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3">
                  <p className="font-heading text-2xl font-bold text-amber-300">
                    {blockedCount}
                  </p>
                  <p className="text-xs text-amber-100/80">Still in use</p>
                </div>
              </div>

              {batchPreview.blocked.length > 0 && (
                <div className="max-h-48 scrollbar-none space-y-2 overflow-y-auto rounded-2xl border border-border/70 bg-background/35 p-3">
                  {batchPreview.blocked.map((item) => (
                    <div key={item.id} className="min-w-0 text-sm">
                      <p className="truncate font-medium" title={item.filename}>
                        {item.filename}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
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
    </div>
  );
}
