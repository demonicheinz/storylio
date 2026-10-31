"use client";

import {
  ArrowSquareOutIcon,
  CalendarBlankIcon,
  CheckSquareIcon,
  CopyIcon,
  DotsThreeVerticalIcon,
  EyeIcon,
  EyeSlashIcon,
  FileImageIcon,
  FolderIcon,
  FunnelSimpleIcon,
  ImageIcon,
  MagnifyingGlassIcon,
  PencilSimpleIcon,
  PlusIcon,
  RulerIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { ReactElement, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { toast } from "@/components/ui/toast";
import {
  actionDeleteGalleryItem,
  actionDeleteGalleryItems,
  actionHideGalleryItems,
  actionReorderGalleryItems,
  actionShowGalleryItems,
} from "@/features/dashboard/gallery/actions";
import { GALLERY_BATCH_LIMIT } from "@/features/dashboard/gallery/constants";
import toolbarStyles from "@/features/dashboard/shared/components/collection-toolbar.module.css";
import {
  DashboardSelect,
  DashboardSort,
  DashboardViewToggle,
} from "@/features/dashboard/shared/components/filter-controls";
import { DashboardPagination } from "@/features/dashboard/shared/components/pagination";
import {
  DashboardSortableList,
  verticalListSortingStrategy,
} from "@/features/dashboard/shared/components/sortable-list";
import { DashboardSummary } from "@/features/dashboard/shared/components/summary";
import { useDashboardFilter } from "@/features/dashboard/shared/hooks/use-dashboard-filter";
import { dashboardStyles } from "@/features/dashboard/shared/styles";
import type { ActionResult } from "@/lib/action-result";
import { formatBytes } from "@/lib/format-bytes";
import {
  getDefaultItemsPerPage,
  getItemsPerPageOptions,
  paginateItems,
} from "@/lib/pagination";
import { cn, formatDate } from "@/lib/utils";

import {
  filterGalleryItems,
  type GallerySortField as SortMode,
  type GalleryVisibilityFilter as VisibilityFilter,
} from "../filtering";
import {
  getDimensions,
  getFileName,
  getGalleryAspectRatio,
  getItemTitle,
} from "../presentation";
import type { DashboardGalleryItem } from "../types";
import { GalleryItemDialog } from "./gallery-item-dialog";

type GalleryManagerProps = {
  items: DashboardGalleryItem[];
};

type ViewMode = "grid" | "list";

function GalleryThumbnail({
  imageUrl,
  caption,
  altText,
  className,
  imageClassName,
}: {
  imageUrl?: string | null;
  caption?: string | null;
  altText?: string | null;
  className?: string;
  imageClassName?: string;
}) {
  const [failed, setFailed] = useState(false);
  // biome-ignore lint/correctness/useExhaustiveDependencies: A new image source must clear the previous failure state.
  useEffect(() => setFailed(false), [imageUrl]);

  if (!imageUrl || failed) {
    return (
      <div
        className={cn(
          "flex justify-center items-center bg-muted h-full min-h-0 text-muted-foreground",
          className,
        )}
      >
        <ImageIcon className="size-10" />
      </div>
    );
  }

  return (
    <Image
      src={imageUrl}
      alt={altText || caption || "Gallery image"}
      fill
      className={cn("object-cover", imageClassName)}
      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 33vw, 25vw"
      onError={() => setFailed(true)}
    />
  );
}

function GalleryStatusBadge({
  isVisible,
  className,
}: {
  isVisible: boolean;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 bg-card px-2 border-border rounded-md h-6 text-xs",
        isVisible ? "text-success" : "text-muted-foreground",
        className,
      )}
    >
      <span aria-hidden className="bg-current rounded-full size-1.5" />
      {isVisible ? "Visible" : "Hidden"}
    </Badge>
  );
}

function GalleryItemActions({
  item,
  align = "end",
  overlay = false,
  disabled = false,
}: {
  item: DashboardGalleryItem;
  align?: "start" | "end";
  overlay?: boolean;
  disabled?: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            size="icon"
            variant={overlay ? "secondary" : "ghost"}
            disabled={disabled}
            className={cn(
              "size-11",
              overlay &&
                "bg-popover/80 border-border shadow-sm hover:bg-surface-hover/90",
            )}
            aria-label={`Open actions for ${getItemTitle(item)}`}
          />
        }
      >
        <DotsThreeVerticalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-44">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Gallery item</DropdownMenuLabel>
          <GalleryItemDialog
            triggerNativeButton={false}
            item={item}
            trigger={
              <DropdownMenuItem closeOnClick={false}>
                <PencilSimpleIcon data-icon="inline-start" />
                Edit item
              </DropdownMenuItem>
            }
          />
          <DropdownMenuSeparator />
          <GalleryDeleteButton
            triggerNativeButton={false}
            item={item}
            trigger={
              <DropdownMenuItem variant="destructive" closeOnClick={false}>
                <TrashIcon data-icon="inline-start" />
                Delete item
              </DropdownMenuItem>
            }
          />
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function GalleryDeleteButton({
  item,
  trigger,
  triggerNativeButton = true,
}: {
  item: DashboardGalleryItem;
  trigger?: ReactElement;
  triggerNativeButton?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const label = item.caption || item.category || "this gallery item";

  const handleDelete = () => {
    startTransition(async () => {
      try {
        const result = await actionDeleteGalleryItem(item.id);

        if (result.success) {
          toast.add({
            title: result.message ?? "Gallery item deleted.",
            type: "success",
          });
          setOpen(false);
          router.refresh();
        } else {
          toast.add({ title: result.error, type: "error" });
        }
      } catch {
        toast.add({
          title: "Could not delete this image. Try again.",
          type: "error",
        });
      }
    });
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!isPending) setOpen(next);
      }}
    >
      <AlertDialogTrigger
        nativeButton={triggerNativeButton}
        role={triggerNativeButton ? undefined : "menuitem"}
        render={
          trigger ?? (
            <Button type="button" size="sm" variant="destructive">
              <TrashIcon data-icon="inline-start" />
              Delete
            </Button>
          )
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete gallery item?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete{" "}
            <span className="font-medium text-foreground">{label}</span>. This
            action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={handleDelete}
          >
            {isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function FilterDropdown({
  label,
  value,
  options,
  onValueChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onValueChange: (value: string) => void;
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

function GalleryGrid({
  items,
  batchMode,
  selectedIds,
  onSelectItem,
  onToggleItem,
  selectionPending,
}: {
  items: DashboardGalleryItem[];
  batchMode: boolean;
  selectedIds: Set<string>;
  onSelectItem: (item: DashboardGalleryItem) => void;
  onToggleItem: (id: string) => void;
  selectionPending: boolean;
}) {
  return (
    <div className={dashboardStyles.gridCards}>
      {items.map((item) => (
        <article
          key={item.id}
          className={cn(
            "group bg-card border border-border hover:border-input rounded-lg min-w-0 overflow-hidden transition-colors",
            selectedIds.has(item.id) && "border-primary bg-primary/5",
          )}
        >
          <div className="relative bg-muted/35 aspect-square overflow-hidden">
            <GalleryThumbnail
              imageUrl={item.imageUrl}
              caption={item.caption}
              altText={item.altText}
            />
            <button
              tabIndex={batchMode ? -1 : 0}
              type="button"
              disabled={selectionPending}
              className="absolute inset-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset cursor-pointer"
              aria-label={`${batchMode ? "Toggle selection for" : "Preview"} ${getItemTitle(item)}`}
              onClick={(event) => {
                event.currentTarget.focus();
                if (batchMode) onToggleItem(item.id);
                else onSelectItem(item);
              }}
            />
            {batchMode && (
              /* biome-ignore lint/a11y/noStaticElementInteractions: This layout wrapper only stops nested control clicks from bubbling; keyboard interaction stays on the controls. */
              <div
                role="presentation"
                className="top-3 left-3 z-10 absolute"
                onClick={(event) => event.stopPropagation()}
              >
                <Checkbox
                  className="after:-inset-x-3.5 after:-inset-y-3.5"
                  disabled={selectionPending}
                  checked={selectedIds.has(item.id)}
                  onCheckedChange={() => onToggleItem(item.id)}
                  aria-label={`Select ${getItemTitle(item)}`}
                />
              </div>
            )}
            {/* biome-ignore lint/a11y/noStaticElementInteractions: This layout wrapper only stops nested control clicks from bubbling; keyboard interaction stays on the controls. */}
            <div
              role="presentation"
              className="top-3 right-3 absolute"
              onClick={(event) => event.stopPropagation()}
            >
              <GalleryItemActions
                item={item}
                overlay
                disabled={selectionPending}
              />
            </div>
          </div>
          <div className="relative">
            <div className="px-4 pt-3 pb-4">
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <GalleryStatusBadge isVisible={item.isVisible} />
                {item.category && (
                  <Badge
                    variant="secondary"
                    className="min-w-0 max-w-full truncate"
                  >
                    {item.category}
                  </Badge>
                )}
              </div>
              <h2
                className="mt-2 font-sans font-semibold text-base truncate leading-snug"
                title={getItemTitle(item)}
              >
                <button
                  tabIndex={batchMode ? -1 : 0}
                  type="button"
                  className="rounded-sm focus-visible:outline-2 focus-visible:outline-ring max-w-full hover:text-link text-left truncate"
                  disabled={selectionPending}
                  onClick={(event) => {
                    event.currentTarget.focus();
                    if (batchMode) onToggleItem(item.id);
                    else onSelectItem(item);
                  }}
                >
                  {getItemTitle(item)}
                </button>
              </h2>
              <p className="flex items-center gap-1.5 mt-2 text-muted-foreground text-xs">
                <CalendarBlankIcon className="size-3.5" />
                {formatDate(item.createdAt)}
              </p>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function galleryListColumns(hasRail: boolean, showPosition: boolean) {
  if (showPosition)
    return hasRail
      ? "grid-cols-[44px_minmax(0,1fr)] xl:grid-cols-[44px_minmax(0,1fr)_110px_140px_64px_120px_64px]"
      : "grid-cols-[minmax(0,1fr)] xl:grid-cols-[minmax(0,1fr)_110px_140px_64px_120px_64px]";
  return hasRail
    ? "grid-cols-[44px_minmax(0,1fr)] xl:grid-cols-[44px_minmax(0,1fr)_110px_140px_120px_64px]"
    : "grid-cols-[minmax(0,1fr)] xl:grid-cols-[minmax(0,1fr)_110px_140px_120px_64px]";
}

function GalleryListHeader({
  hasRail,
  showPosition,
}: {
  hasRail: boolean;
  showPosition: boolean;
}) {
  return (
    <div
      data-gallery-list-header
      className={cn(
        "hidden xl:grid border-border border-b font-medium text-muted-foreground text-xs",
        galleryListColumns(hasRail, showPosition),
      )}
    >
      {hasRail && <div />}
      <div className="py-3 pr-3 pl-34">Image</div>
      <div className="p-3">Visibility</div>
      <div className="p-3">Category</div>
      {showPosition && <div className="p-3">Position</div>}
      <div className="p-3">Added</div>
      <div className="p-3 text-center">Actions</div>
    </div>
  );
}

function GalleryListRow({
  item,
  handle,
  isDragging,
  batchMode,
  selected,
  onSelectItem,
  onToggleItem,
  selectionPending,
  showPosition,
  position,
}: {
  item: DashboardGalleryItem;
  handle: ReactNode;
  isDragging: boolean;
  batchMode: boolean;
  selected: boolean;
  onSelectItem: (item: DashboardGalleryItem) => void;
  onToggleItem: (id: string) => void;
  selectionPending: boolean;
  showPosition: boolean;
  position: number;
}) {
  const hasRail = batchMode || Boolean(handle);
  return (
    <div
      className={cn(
        "grid min-w-0",
        galleryListColumns(hasRail, showPosition),
        selected && "border-brand-soft/60 bg-brand/5",
        batchMode && "cursor-pointer",
        isDragging && "relative z-10 bg-background/70 opacity-80",
      )}
    >
      {hasRail && (
        <div className="row-span-2 xl:row-span-1">
          {batchMode ? (
            /* biome-ignore lint/a11y/noStaticElementInteractions: This layout wrapper only stops nested control clicks from bubbling; keyboard interaction stays on the controls. */
            <div
              role="presentation"
              className="flex justify-center items-center border-border/50 border-r h-full min-h-20"
              onClick={(event) => event.stopPropagation()}
            >
              <Checkbox
                className="after:-inset-x-3.5 after:-inset-y-3.5"
                disabled={selectionPending}
                checked={selected}
                onCheckedChange={() => onToggleItem(item.id)}
                aria-label={`Select ${getItemTitle(item)}`}
              />
            </div>
          ) : (
            handle
          )}
        </div>
      )}
      <button
        tabIndex={batchMode ? -1 : 0}
        type="button"
        className="flex items-center gap-3 p-3 min-w-0 text-left disabled:cursor-pointer"
        disabled={selectionPending}
        onClick={(event) => {
          event.currentTarget.focus();
          if (batchMode) onToggleItem(item.id);
          else onSelectItem(item);
        }}
      >
        <div
          data-gallery-list-thumbnail
          className="relative bg-muted/35 border border-border/50 rounded-xl w-28 h-16 overflow-hidden shrink-0"
        >
          <GalleryThumbnail
            imageUrl={item.imageUrl}
            caption={item.caption}
            altText={item.altText}
            imageClassName="object-cover"
          />
        </div>
        <div className="min-w-0">
          <p
            className="font-medium truncate leading-snug"
            title={getItemTitle(item)}
          >
            {getItemTitle(item)}
          </p>
          <p className="xl:hidden mt-1 text-muted-foreground text-xs truncate">
            {item.category || "Uncategorized"}
          </p>
        </div>
      </button>
      <div className="hidden xl:flex items-center p-3">
        <GalleryStatusBadge isVisible={item.isVisible} />
      </div>
      <div className="hidden xl:flex items-center p-3 min-w-0">
        <Badge variant="secondary" className="min-w-0 max-w-full truncate">
          {item.category || "Uncategorized"}
        </Badge>
      </div>
      {showPosition && (
        <div className="hidden xl:flex items-center p-3 text-muted-foreground text-sm">
          {position}
        </div>
      )}
      <div className="hidden xl:flex items-center p-3 text-muted-foreground text-sm">
        {formatDate(item.createdAt)}
      </div>
      <div
        className={cn(
          "flex items-center gap-2 xl:p-3 px-3 pb-3 xl:pl-0 xl:col-auto",
          hasRail ? "col-start-2" : "col-start-1",
        )}
      >
        <div className="xl:hidden flex flex-wrap items-center gap-2">
          <GalleryStatusBadge isVisible={item.isVisible} />
          <span className="text-muted-foreground text-xs">
            {formatDate(item.createdAt)}
          </span>
        </div>
        {/* biome-ignore lint/a11y/noStaticElementInteractions: This layout wrapper only stops nested control clicks from bubbling; keyboard interaction stays on the controls. */}
        <div
          role="presentation"
          className="ml-auto"
          onClick={(event) => event.stopPropagation()}
        >
          <GalleryItemActions item={item} disabled={selectionPending} />
        </div>
      </div>
    </div>
  );
}

function GalleryBatchActionsBar({
  selectedCount,
  isPending,
  onShow,
  onHide,
  onDelete,
  onCancel,
  selectedItems,
  outsideViewCount,
  onTogglePage,
  pageSelected,
}: {
  selectedCount: number;
  isPending: boolean;
  onShow: () => void;
  onHide: () => void;
  onDelete: () => void;
  onCancel: () => void;
  selectedItems: DashboardGalleryItem[];
  outsideViewCount: number;
  onTogglePage: () => void;
  pageSelected: boolean;
}) {
  return (
    <div className="flex sm:flex-row flex-col sm:justify-between sm:items-start gap-3 bg-card p-3 border border-border rounded-lg">
      <div className="min-w-0">
        <p className="font-medium text-foreground text-sm">
          {selectedCount} {selectedCount === 1 ? "item" : "items"} selected
        </p>
        <p className="text-muted-foreground text-xs">
          Up to {GALLERY_BATCH_LIMIT} images per batch.{" "}
          {outsideViewCount > 0 &&
            `${outsideViewCount} selected outside this page.`}
        </p>
        {selectedItems.length > 0 && (
          <details className="mt-2 text-sm">
            <summary className="rounded-sm focus-visible:outline-2 focus-visible:outline-ring cursor-pointer">
              Review selected images
            </summary>
            <ul
              className="space-y-1 mt-2 max-h-40 overflow-y-auto"
              aria-label="Selected images"
            >
              {selectedItems.map((item) => (
                <li key={item.id} className="wrap-anywhere">
                  {getItemTitle(item)}
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
      <div className="sm:flex sm:flex-wrap sm:justify-end gap-2 grid grid-cols-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={onTogglePage}
        >
          {pageSelected ? "Deselect page" : "Select page"}
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={isPending || selectedCount === 0}
          onClick={onShow}
        >
          <EyeIcon data-icon="inline-start" />
          Show
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isPending || selectedCount === 0}
          onClick={onHide}
        >
          <EyeSlashIcon data-icon="inline-start" />
          Hide
        </Button>
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={isPending || selectedCount === 0}
              />
            }
          >
            <TrashIcon data-icon="inline-start" />
            Delete
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Delete selected gallery items?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete {selectedCount}{" "}
                {selectedCount === 1 ? "item" : "items"}. This action cannot be
                undone.
              </AlertDialogDescription>
              <ul
                className="space-y-1 my-3 max-h-48 overflow-y-auto text-sm"
                aria-label="Images to delete"
              >
                {selectedItems.map((item) => (
                  <li key={item.id} className="wrap-anywhere">
                    {getItemTitle(item)}
                  </li>
                ))}
              </ul>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={isPending}
                onClick={onDelete}
              >
                {isPending ? "Deleting..." : "Delete selected"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={isPending}
          onClick={onCancel}
        >
          Clear selection
        </Button>
      </div>
    </div>
  );
}

function GalleryDetailDrawer({
  item,
  direction,
  onClose,
  returnFocus,
  open,
}: {
  item: DashboardGalleryItem;
  direction: "down" | "right";
  onClose: () => void;
  returnFocus: React.RefObject<HTMLElement | null>;
  open: boolean;
}) {
  const aspectRatio = getGalleryAspectRatio(item);

  const handleCopyImageUrl = async () => {
    try {
      await navigator.clipboard.writeText(item.imageUrl);
      toast.add({ title: "Image URL copied.", type: "success" });
    } catch {
      toast.add({
        title:
          "Could not copy the URL. Use View to open the image and copy its address.",
        type: "error",
      });
    }
  };

  const metadata = [
    {
      icon: <CalendarBlankIcon />,
      label: "Created",
      value: formatDate(item.createdAt),
    },
    {
      icon: <FileImageIcon />,
      label: "File name",
      value: getFileName(item.imageUrl),
    },
    {
      icon: <FolderIcon />,
      label: "Size",
      value: item.size ? formatBytes(item.size) : "Not stored",
    },
    { icon: <RulerIcon />, label: "Dimensions", value: getDimensions(item) },
  ];

  return (
    <Drawer
      open={open}
      swipeDirection={direction}
      showSwipeHandle
      onOpenChange={(open) => !open && onClose()}
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
          <DrawerTitle>Gallery item detail</DrawerTitle>
          <DrawerDescription>
            Preview metadata and actions for {getItemTitle(item)}.
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 px-4 pt-7 pb-4 min-h-0 overflow-y-auto scrollbar-none">
            <div
              className="relative bg-muted/35 border border-border rounded-xl w-full overflow-hidden"
              style={{ aspectRatio }}
            >
              <GalleryThumbnail
                imageUrl={item.imageUrl}
                caption={item.caption}
                altText={item.altText}
                imageClassName="object-contain"
              />
            </div>
            <h3
              className="mt-4 font-semibold text-xl leading-tight wrap-anywhere"
              title={getItemTitle(item)}
            >
              {getItemTitle(item)}
            </h3>
            <div className="flex flex-wrap gap-2 mt-2">
              <GalleryStatusBadge isVisible={item.isVisible} />
              {item.category && (
                <Badge variant="secondary">{item.category}</Badge>
              )}
            </div>

            {item.description && (
              <p className="mt-3 text-muted-foreground text-sm leading-6 wrap-anywhere">
                {item.description}
              </p>
            )}
            {item.altText && (
              <p className="mt-3 text-sm leading-6 wrap-anywhere">
                <span className="text-muted-foreground">Alt text: </span>
                {item.altText}
              </p>
            )}

            <div className="gap-4 grid grid-cols-2 mt-4 pt-4 border-border border-t">
              {metadata.map((row) => (
                <div key={row.label} className="flex items-start gap-2 min-w-0">
                  <span className="mt-0.5 [&_svg]:size-4 text-muted-foreground">
                    {row.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="text-muted-foreground text-xs">{row.label}</p>
                    <p className="mt-0.5 font-medium text-sm line-clamp-2 wrap-anywhere">
                      {row.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DrawerFooter className="gap-2 grid px-4 pb-4">
            <GalleryItemDialog
              item={item}
              trigger={
                <Button type="button" variant="secondary" className="w-full">
                  <PencilSimpleIcon data-icon="inline-start" />
                  Edit Item
                </Button>
              }
            />
            <div className="gap-2 grid grid-cols-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCopyImageUrl}
              >
                <CopyIcon data-icon="inline-start" />
                Copy URL
              </Button>
              <Button
                role="link"
                type="button"
                variant="outline"
                render={
                  <a href={item.imageUrl} target="_blank" rel="noreferrer" />
                }
                nativeButton={false}
              >
                <ArrowSquareOutIcon data-icon="inline-start" />
                View
              </Button>
            </div>
            <div className="flex justify-end">
              <GalleryItemActions item={item} />
            </div>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

const visibilityOptions = [
  { value: "all", label: "All images" },
  { value: "visible", label: "Visible" },
  { value: "hidden", label: "Hidden" },
];
const sortOptions = [
  { value: "order", label: "Display order" },
  { value: "created", label: "Date created" },
];

export function GalleryManager({ items }: GalleryManagerProps) {
  const router = useRouter();
  const [reorderMode, setReorderMode] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const reorderLock = useRef(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [query, setQuery] = useState("");
  const [visibility, setVisibility] = useDashboardFilter<VisibilityFilter>(
    "visibility",
    ["all", "visible", "hidden"],
    "all",
  );
  const [category, setCategory] = useState("all");
  const [sortMode, setSortMode] = useState<SortMode>("order");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [itemsPerPage, setItemsPerPage] = useState<number>(
    getDefaultItemsPerPage("grid"),
  );
  const [page, setPage] = useState(1);
  const [batchMode, setBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBatchPending, startBatchTransition] = useTransition();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [drawerDirection, setDrawerDirection] = useState<"down" | "right">(
    "down",
  );
  const detailTriggerRef = useRef<HTMLElement | null>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const desktopSearchInputRef = useRef<HTMLInputElement>(null);
  const filtersTriggerRef = useRef<HTMLButtonElement>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draftVisibility, setDraftVisibility] =
    useState<VisibilityFilter>("all");
  const [draftCategory, setDraftCategory] = useState("all");
  const [draftSort, setDraftSort] = useState<SortMode>("order");
  const [draftDirection, setDraftDirection] = useState<"asc" | "desc">("asc");
  const [draftView, setDraftView] = useState<ViewMode>("grid");
  const previousView = useRef<{
    query: string;
    visibility: VisibilityFilter;
    category: string;
    sortMode: SortMode;
    direction: "asc" | "desc";
    viewMode: ViewMode;
    itemsPerPage: number;
  } | null>(null);
  const selectedItem = items.find((item) => item.id === selectedItemId);
  const categories = useMemo(
    () =>
      [
        ...new Set(
          items.flatMap((item) => (item.category ? [item.category] : [])),
        ),
      ].sort((a, b) => a.localeCompare(b)),
    [items],
  );
  const categoryOptions = [
    { value: "all", label: "All categories" },
    ...categories.map((value) => ({ value, label: value })),
  ];
  const stats = {
    total: items.length,
    visible: items.filter((item) => item.isVisible).length,
    hidden: items.filter((item) => !item.isVisible).length,
    categories: categories.length,
  };
  const filteredItems = useMemo(
    () =>
      filterGalleryItems(items, {
        query,
        visibility,
        category,
        sortMode,
        sortDirection,
      }),
    [items, query, visibility, category, sortMode, sortDirection],
  );
  const {
    items: paginatedItems,
    pageCount,
    currentPage,
    firstIndex,
    lastIndex,
  } = paginateItems(filteredItems, page, itemsPerPage);
  const itemsPerPageOptions = getItemsPerPageOptions(viewMode);
  const pageSelected =
    paginatedItems.length > 0 &&
    paginatedItems.every((item) => selectedIds.has(item.id));
  const selectedItems = items.filter((item) => selectedIds.has(item.id));
  const outsideViewCount = selectedItems.filter(
    (item) => !paginatedItems.some((row) => row.id === item.id),
  ).length;
  const activeFilterCount =
    Number(visibility !== "all") +
    Number(category !== "all") +
    Number(sortMode !== "order" || sortDirection !== "asc");

  // biome-ignore lint/correctness/useExhaustiveDependencies: Category, visibility, query, sort and page size are deliberate pagination-reset triggers.
  useEffect(() => {
    setPage(1);
  }, [category, itemsPerPage, query, sortMode, sortDirection, visibility]);
  useEffect(() => {
    const ids = new Set(items.map((item) => item.id));
    setSelectedIds((previous) => {
      const next = new Set([...previous].filter((id) => ids.has(id)));
      return next.size === previous.size ? previous : next;
    });
    if (selectedItemId && !ids.has(selectedItemId)) {
      setDetailOpen(false);
      setSelectedItemId(null);
    }
  }, [items, selectedItemId]);
  useEffect(() => {
    const media = matchMedia("(min-width: 768px)");
    const sync = () => setDrawerDirection(media.matches ? "right" : "down");
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() !== "k" ||
        !(event.ctrlKey || event.metaKey) ||
        filtersOpen ||
        detailOpen
      )
        return;
      event.preventDefault();
      const input = matchMedia("(max-width: 767px)").matches
        ? mobileSearchInputRef.current
        : desktopSearchInputRef.current;
      input?.focus();
      input?.select();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [filtersOpen, detailOpen]);

  const handleViewModeChange = (value: ViewMode) => {
    setViewMode(value);
    if (value !== viewMode) setItemsPerPage(getDefaultItemsPerPage(value));
  };
  const clearSelection = () => {
    setSelectedIds(new Set());
    setBatchMode(false);
  };
  const selectionLimit = () =>
    toast.add({
      title: `Select no more than ${GALLERY_BATCH_LIMIT} images at a time.`,
      type: "error",
    });
  const toggleItemSelection = (id: string) => {
    if (isBatchPending) return;
    if (!selectedIds.has(id) && selectedIds.size >= GALLERY_BATCH_LIMIT) {
      selectionLimit();
      return;
    }
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const togglePageSelection = () => {
    if (isBatchPending) return;
    const allSelected = pageSelected;
    const next = new Set(selectedIds);
    for (const item of paginatedItems) {
      if (allSelected) next.delete(item.id);
      else if (next.size < GALLERY_BATCH_LIMIT) next.add(item.id);
    }
    if (!allSelected && paginatedItems.some((item) => !next.has(item.id)))
      selectionLimit();
    setSelectedIds(next);
  };
  const runBatchAction = (
    action: (ids: string[]) => Promise<ActionResult<{ count: number }>>,
    message: string,
  ) => {
    if (isBatchPending || !selectedItems.length) return;
    const ids = selectedItems.map((item) => item.id);
    startBatchTransition(async () => {
      try {
        const result = await action(ids);
        if (!result.success) {
          toast.add({ title: result.error, type: "error" });
          return;
        }
        toast.add({ title: result.message ?? message, type: "success" });
        clearSelection();
        router.refresh();
      } catch {
        toast.add({
          title:
            "Could not complete this action. Your selection is retained; try again.",
          type: "error",
        });
      }
    });
  };
  const handleReorder = async (next: DashboardGalleryItem[]) => {
    if (
      !reorderMode ||
      reorderLock.current ||
      next.length !== items.length ||
      new Set(next.map((item) => item.id)).size !== items.length
    )
      return false;
    reorderLock.current = true;
    setIsReordering(true);
    try {
      const result = await actionReorderGalleryItems(
        next.map((item, index) => ({ id: item.id, order: index })),
      );
      if (!result.success) {
        toast.add({ title: result.error, type: "error" });
        return false;
      }
      toast.add({
        title: result.message ?? "Gallery order updated.",
        type: "success",
      });
      router.refresh();
      return true;
    } catch {
      toast.add({
        title:
          "Could not save the order. The previous order has been restored.",
        type: "error",
      });
      return false;
    } finally {
      reorderLock.current = false;
      setIsReordering(false);
    }
  };
  const toggleReorderMode = () => {
    if (isReordering || isBatchPending) return;
    if (reorderMode) {
      setReorderMode(false);
      const previous = previousView.current;
      if (previous) {
        setQuery(previous.query);
        setVisibility(previous.visibility);
        setCategory(previous.category);
        setSortMode(previous.sortMode);
        setSortDirection(previous.direction);
        setViewMode(previous.viewMode);
        setItemsPerPage(previous.itemsPerPage);
      }
      setPage(1);
      return;
    }
    previousView.current = {
      query,
      visibility,
      category,
      sortMode,
      direction: sortDirection,
      viewMode,
      itemsPerPage,
    };
    setQuery("");
    setVisibility("all");
    setCategory("all");
    setSortMode("order");
    setSortDirection("asc");
    setViewMode("list");
    setPage(1);
    clearSelection();
    setReorderMode(true);
  };
  const openItemDetails = (item: DashboardGalleryItem) => {
    detailTriggerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setSelectedItemId(item.id);
    setDetailOpen(true);
  };
  const clearFilters = () => {
    setQuery("");
    setVisibility("all");
    setCategory("all");
    setSortMode("order");
    setSortDirection("asc");
  };
  const openFilters = (open: boolean) => {
    if (open) {
      setDraftVisibility(visibility);
      setDraftCategory(category);
      setDraftSort(sortMode);
      setDraftDirection(sortDirection);
      setDraftView(viewMode);
    }
    setFiltersOpen(open);
  };
  const resetDraft = () => {
    setDraftVisibility("all");
    setDraftCategory("all");
    setDraftSort("order");
    setDraftDirection("asc");
  };
  const applyFilters = () => {
    setVisibility(draftVisibility);
    setCategory(draftCategory);
    setSortMode(draftSort);
    setSortDirection(draftDirection);
    handleViewModeChange(draftView);
    setFiltersOpen(false);
  };
  const toggleBatchMode = () => {
    if (isBatchPending) return;
    if (batchMode) clearSelection();
    else setBatchMode(true);
  };
  const renderFilters = (mobile = false) => (
    <>
      <FilterDropdown
        label="Visibility"
        value={mobile ? draftVisibility : visibility}
        options={visibilityOptions}
        onValueChange={(value) =>
          mobile
            ? setDraftVisibility(value as VisibilityFilter)
            : setVisibility(value as VisibilityFilter)
        }
      />
      <FilterDropdown
        label="Category"
        value={mobile ? draftCategory : category}
        options={categoryOptions}
        onValueChange={mobile ? setDraftCategory : setCategory}
      />
      <DashboardSort
        value={mobile ? draftSort : sortMode}
        options={sortOptions}
        direction={mobile ? draftDirection : sortDirection}
        onDirectionChange={mobile ? setDraftDirection : setSortDirection}
        onValueChange={(value) =>
          mobile
            ? setDraftSort(value as SortMode)
            : setSortMode(value as SortMode)
        }
      />
    </>
  );

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
            <h1 className="font-heading font-bold text-3xl">Gallery</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground text-sm leading-6">
              Manage gallery images, visibility, categories, and display order.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              disabled={isReordering || isBatchPending || items.length < 2}
              aria-pressed={reorderMode}
              onClick={toggleReorderMode}
            >
              {isReordering
                ? "Saving order..."
                : reorderMode
                  ? "Done reordering"
                  : "Reorder"}
            </Button>
            <GalleryItemDialog
              categories={categories}
              trigger={
                <Button
                  className="shrink-0"
                  disabled={reorderMode || isBatchPending}
                >
                  <PlusIcon data-icon="inline-start" />
                  Add image
                </Button>
              }
            />
          </div>
        </div>
        <DashboardSummary
          items={[
            { label: "Images", value: stats.total },
            { label: "Visible", value: stats.visible },
            { label: "Hidden", value: stats.hidden },
            { label: "Categories", value: stats.categories },
          ]}
        />
        {!reorderMode && (
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
                      ref={mobileSearchInputRef}
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search..."
                      aria-label="Search gallery items"
                      className="pr-3 pl-9"
                    />
                  </div>
                  <DrawerTrigger
                    render={
                      <Button
                        ref={filtersTriggerRef}
                        type="button"
                        variant="outline"
                        size="icon"
                        className="relative p-0 size-11"
                        aria-label={
                          activeFilterCount
                            ? `Filters (${activeFilterCount})`
                            : "Filters"
                        }
                        title="Filters"
                      />
                    }
                  >
                    <FunnelSimpleIcon aria-hidden />
                    {activeFilterCount > 0 && (
                      <span
                        className="-top-1 -right-1 absolute bg-primary px-1 rounded-full min-w-4 h-4 text-primary-foreground text-xs"
                        aria-hidden
                      >
                        {activeFilterCount}
                      </span>
                    )}
                  </DrawerTrigger>
                  <Button
                    type="button"
                    variant={batchMode ? "secondary" : "outline"}
                    size="icon"
                    className="p-0 size-11"
                    disabled={isBatchPending}
                    aria-label={batchMode ? "Exit selection mode" : "Select"}
                    aria-pressed={batchMode}
                    onClick={toggleBatchMode}
                  >
                    <CheckSquareIcon aria-hidden />
                  </Button>
                </div>
              </div>
              <div className="hidden items-end gap-3 md:grid md:grid-cols-2 xl:grid-cols-[minmax(160px,1fr)_130px_minmax(140px,190px)_220px_auto] min-w-0">
                <div className="flex flex-col gap-1.5 md:col-span-2 xl:col-span-1 min-w-0">
                  <span className="text-muted-foreground text-xs">Search</span>
                  <div className="relative">
                    <MagnifyingGlassIcon
                      aria-hidden
                      className="top-1/2 left-3 absolute size-4 text-muted-foreground -translate-y-1/2 pointer-events-none"
                    />
                    <Input
                      ref={desktopSearchInputRef}
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search images..."
                      aria-label="Search gallery items"
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
                    onValueChange={handleViewModeChange}
                  />
                  <Button
                    type="button"
                    variant={batchMode ? "secondary" : "outline"}
                    disabled={isBatchPending}
                    onClick={toggleBatchMode}
                  >
                    {batchMode ? "Cancel" : "Select"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {(reorderMode || activeFilterCount > 0 || query.trim()) && (
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div
              className="flex flex-wrap items-center gap-3 text-muted-foreground text-sm"
              role="status"
            >
              <span>
                {reorderMode
                  ? `Reordering all ${items.length} images, including hidden items. Changes save as you move images.`
                  : `${filteredItems.length} ${filteredItems.length === 1 ? "image" : "images"} found`}
              </span>
              {!reorderMode && (activeFilterCount > 0 || query.trim()) && (
                <Button
                  type="button"
                  size="sm"
                  variant="link"
                  className="px-0"
                  onClick={clearFilters}
                >
                  Clear filters and search
                </Button>
              )}
            </div>
          </div>
        )}
        {batchMode && (
          <GalleryBatchActionsBar
            selectedCount={selectedItems.length}
            selectedItems={selectedItems}
            outsideViewCount={outsideViewCount}
            onTogglePage={togglePageSelection}
            pageSelected={pageSelected}
            isPending={isBatchPending}
            onShow={() =>
              runBatchAction(actionShowGalleryItems, "Selected images shown.")
            }
            onHide={() =>
              runBatchAction(actionHideGalleryItems, "Selected images hidden.")
            }
            onDelete={() =>
              runBatchAction(
                actionDeleteGalleryItems,
                "Selected images deleted.",
              )
            }
            onCancel={clearSelection}
          />
        )}
        {!filteredItems.length ? (
          <div className={dashboardStyles.emptyState}>
            <ImageIcon
              aria-hidden
              className="size-12 text-muted-foreground/50"
            />
            <div>
              <p className="font-medium">
                {items.length
                  ? "No images match these filters"
                  : "No gallery images yet"}
              </p>
              <p className="mt-1 text-muted-foreground text-sm">
                {items.length
                  ? "Clear filters or try another search."
                  : "Add your first image and choose a category."}
              </p>
            </div>
            {items.length ? (
              <Button type="button" variant="outline" onClick={clearFilters}>
                Clear filters and search
              </Button>
            ) : (
              <GalleryItemDialog
                categories={categories}
                trigger={<Button>Add image</Button>}
              />
            )}
          </div>
        ) : viewMode === "grid" ? (
          <GalleryGrid
            items={paginatedItems}
            batchMode={batchMode}
            selectedIds={selectedIds}
            onSelectItem={openItemDetails}
            onToggleItem={toggleItemSelection}
            selectionPending={isBatchPending}
          />
        ) : (
          <div className={dashboardStyles.listSurface}>
            <GalleryListHeader
              hasRail={reorderMode || batchMode}
              showPosition={reorderMode}
            />
            <DashboardSortableList
              items={reorderMode ? filteredItems : paginatedItems}
              disabled={!reorderMode || isReordering || batchMode}
              className={dashboardStyles.listRows}
              strategy={verticalListSortingStrategy}
              getItemLabel={getItemTitle}
              onReorder={handleReorder}
              renderItem={({ item, index, handle, isDragging }) => (
                <GalleryListRow
                  item={item}
                  handle={reorderMode ? handle : null}
                  isDragging={isDragging}
                  batchMode={batchMode}
                  selected={selectedIds.has(item.id)}
                  onSelectItem={openItemDetails}
                  onToggleItem={toggleItemSelection}
                  selectionPending={isBatchPending}
                  showPosition={reorderMode}
                  position={index + 1}
                />
              )}
            />
          </div>
        )}
        {!reorderMode && filteredItems.length > 0 && (
          <DashboardPagination
            firstIndex={firstIndex}
            lastIndex={lastIndex}
            total={filteredItems.length}
            page={currentPage}
            pageCount={pageCount}
            itemsPerPage={itemsPerPage}
            itemsPerPageOptions={itemsPerPageOptions}
            onPageChange={setPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        )}
        {selectedItem && (
          <GalleryDetailDrawer
            open={detailOpen}
            item={selectedItem}
            direction={drawerDirection}
            onClose={() => setDetailOpen(false)}
            returnFocus={detailTriggerRef}
          />
        )}
      </div>
      <DrawerContent finalFocus={filtersTriggerRef} className="p-0">
        <DrawerHeader>
          <DrawerTitle>Filters</DrawerTitle>
          <DrawerDescription>
            Refine images by visibility, category, and order.
          </DrawerDescription>
        </DrawerHeader>
        <div className="gap-4 grid px-4 pb-2 max-h-[52dvh] overflow-y-auto">
          {renderFilters(true)}
          <div className="flex flex-col gap-1.5">
            <span className="text-muted-foreground text-xs">View</span>
            <DashboardViewToggle
              value={draftView}
              onValueChange={setDraftView}
            />
          </div>
        </div>
        <DrawerFooter>
          <div className="gap-2 grid grid-cols-2">
            <Button type="button" variant="outline" onClick={resetDraft}>
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
