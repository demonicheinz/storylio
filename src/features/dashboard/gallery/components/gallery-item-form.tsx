"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  CalendarBlankIcon,
  CaretDownIcon,
  CaretLeftIcon,
  CaretRightIcon,
  DotsThreeVerticalIcon,
  EyeIcon,
  EyeSlashIcon,
  FileImageIcon,
  FolderIcon,
  GridFourIcon,
  ImageIcon,
  ListBulletsIcon,
  MagnifyingGlassIcon,
  PencilSimpleIcon,
  PlusIcon,
  RulerIcon,
  SpinnerIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
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
  AlertDialogTrigger,
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  actionCreateGalleryItem,
  actionDeleteGalleryItem,
  actionDeleteGalleryItems,
  actionHideGalleryItems,
  actionReorderGalleryItems,
  actionShowGalleryItems,
  actionUpdateGalleryItem,
} from "@/features/dashboard/gallery/actions";
import {
  type GalleryItemActionInput,
  type GalleryItemActionValues,
  galleryItemActionSchema,
} from "@/features/dashboard/gallery/validations";
import { ImageUpload } from "@/features/dashboard/shared/components/image-upload";
import {
  DashboardSortableList,
  verticalListSortingStrategy,
} from "@/features/dashboard/shared/components/sortable-list";
import { dashboardStyles } from "@/features/dashboard/shared/styles";
import { blurBeforeOpen } from "@/features/dashboard/shared/utils/overlay-focus";
import type { ActionResult } from "@/lib/action-result";
import {
  getDefaultItemsPerPage,
  getItemsPerPageOptions,
  paginateItems,
} from "@/lib/pagination";
import { cn, formatDate } from "@/lib/utils";

export type DashboardGalleryItem = {
  id: string;
  imageUrl: string;
  caption: string | null;
  category: string | null;
  description: string | null;
  altText: string | null;
  width: number | null;
  height: number | null;
  aspectRatio: number | null;
  blurDataUrl: string | null;
  isVisible: boolean;
  order: number;
  createdAt: string;
};

type GalleryManagerProps = {
  items: DashboardGalleryItem[];
};

type GalleryItemDialogProps = {
  item?: DashboardGalleryItem;
  trigger: ReactNode;
};

type ViewMode = "grid" | "list";
type VisibilityFilter = "all" | "visible" | "hidden";
type SortMode = "order-asc" | "order-desc" | "created-desc" | "created-asc";

const emptyDefaults: GalleryItemActionValues = {
  imageUrl: "",
  caption: "",
  description: "",
  altText: "",
  category: "",
  width: undefined,
  height: undefined,
  aspectRatio: undefined,
  blurDataUrl: undefined,
  isVisible: true,
  order: 0,
};

function getDefaults(item?: DashboardGalleryItem): GalleryItemActionValues {
  if (!item) {
    return emptyDefaults;
  }

  return {
    imageUrl: item.imageUrl,
    caption: item.caption ?? "",
    description: item.description ?? "",
    altText: item.altText ?? "",
    category: item.category ?? "",
    width: item.width ?? undefined,
    height: item.height ?? undefined,
    aspectRatio: item.aspectRatio ?? undefined,
    blurDataUrl: item.blurDataUrl ?? undefined,
    isVisible: item.isVisible,
    order: item.order,
  };
}

function GalleryThumbnail({
  imageUrl,
  caption,
  className,
  imageClassName,
}: {
  imageUrl?: string | null;
  caption?: string | null;
  className?: string;
  imageClassName?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!imageUrl || failed) {
    return (
      <div
        className={cn(
          "flex h-full min-h-30 items-center justify-center bg-muted text-muted-foreground",
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
      alt={caption || "Gallery image"}
      fill
      className={cn("object-cover", imageClassName)}
      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 33vw, 25vw"
      onError={() => setFailed(true)}
    />
  );
}

function getItemTitle(item: DashboardGalleryItem) {
  return item.caption || item.altText || item.category || "Untitled image";
}

function getFileName(imageUrl: string) {
  try {
    const pathname = new URL(imageUrl).pathname;
    return decodeURIComponent(pathname.split("/").filter(Boolean).pop() ?? "");
  } catch {
    return imageUrl.split("/").filter(Boolean).pop() ?? "Unknown file";
  }
}

function getDimensions(item: DashboardGalleryItem) {
  if (!item.width || !item.height) {
    return "Not stored";
  }

  return `${item.width} x ${item.height}`;
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
      variant={isVisible ? "default" : "secondary"}
      className={cn(
        isVisible
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground",
        className,
      )}
    >
      {isVisible ? "Visible" : "Hidden"}
    </Badge>
  );
}

function GalleryItemActions({
  item,
  align = "end",
}: {
  item: DashboardGalleryItem;
  align?: "start" | "end";
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="size-8 rounded-xl bg-background/70 text-foreground backdrop-blur hover:bg-background"
          aria-label={`Open actions for ${getItemTitle(item)}`}
        >
          <DotsThreeVerticalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-44">
        <DropdownMenuLabel>Gallery item</DropdownMenuLabel>
        <GalleryItemDialog
          item={item}
          trigger={
            <DropdownMenuItem
              className="cursor-pointer"
              onSelect={(event) => event.preventDefault()}
            >
              <PencilSimpleIcon data-icon="inline-start" />
              Edit item
            </DropdownMenuItem>
          }
        />
        <DropdownMenuSeparator />
        <GalleryDeleteButton
          item={item}
          trigger={
            <DropdownMenuItem
              className="cursor-pointer"
              variant="destructive"
              onSelect={(event) => event.preventDefault()}
            >
              <TrashIcon data-icon="inline-start" />
              Delete item
            </DropdownMenuItem>
          }
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function GalleryItemDialog({ item, trigger }: GalleryItemDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError,
    setValue,
    watch,
  } = useForm<GalleryItemActionInput, unknown, GalleryItemActionValues>({
    resolver: zodResolver(galleryItemActionSchema),
    defaultValues: getDefaults(item),
  });

  const imageUrl = watch("imageUrl");
  const isEdit = Boolean(item);

  const applyFieldErrors = (fieldErrors?: Record<string, string[]>) => {
    if (!fieldErrors) {
      return;
    }

    for (const [field, messages] of Object.entries(fieldErrors)) {
      if (messages[0]) {
        setError(field as keyof GalleryItemActionValues, {
          message: messages[0],
          type: "server",
        });
      }
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      reset(getDefaults(item));
    }
  };

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result =
        isEdit && item
          ? await actionUpdateGalleryItem(item.id, values)
          : await actionCreateGalleryItem(values);

      if (result.success) {
        toast.success(
          result.message ??
            (isEdit ? "Gallery item updated." : "Gallery item created."),
        );
        setOpen(false);
        router.refresh();
      } else {
        applyFieldErrors(result.fieldErrors);
        toast.error(result.error);
      }
    });
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[calc(100vh-2rem)] scrollbar-none overflow-y-auto sm:max-w-xl">
        <form className="flex flex-col gap-5" onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Edit Gallery Item" : "Add Gallery Item"}
            </DialogTitle>
            <DialogDescription>
              Upload an image, set its category, and control its display order.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label>Image</Label>
            <ImageUpload
              value={imageUrl}
              disabled={isPending}
              previewClassName="bg-muted/40"
              previewImageClassName="object-contain"
              onChange={(url, metadata) => {
                setValue("imageUrl", url, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
                setValue("width", metadata?.width ?? undefined, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
                setValue("height", metadata?.height ?? undefined, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
                setValue("aspectRatio", metadata?.aspectRatio ?? undefined, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
                setValue("blurDataUrl", metadata?.blurDataUrl ?? undefined, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }}
              onRemove={() =>
                setValue("imageUrl", "", {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            />
            {errors.imageUrl?.message && (
              <p className="text-sm text-destructive">
                {errors.imageUrl.message}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="altText">Alt text</Label>
              <Input
                id="altText"
                placeholder="Interface detail with dark cards"
                aria-invalid={!!errors.altText}
                disabled={isPending}
                {...register("altText")}
              />
              {errors.altText?.message && (
                <p className="text-sm text-destructive">
                  {errors.altText.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-background/35 p-4">
              <div>
                <Label htmlFor="isVisible">Visible publicly</Label>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Hidden items stay editable here but are not shown on the
                  public Gallery.
                </p>
              </div>
              <Switch
                id="isVisible"
                checked={watch("isVisible")}
                disabled={isPending}
                onCheckedChange={(checked) =>
                  setValue("isVisible", checked, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                placeholder="Interface"
                aria-invalid={!!errors.category}
                disabled={isPending}
                {...register("category")}
              />
              {errors.category?.message && (
                <p className="text-sm text-destructive">
                  {errors.category.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="order">Display order</Label>
              <Input
                id="order"
                type="number"
                min={0}
                aria-invalid={!!errors.order}
                disabled={isPending}
                {...register("order")}
              />
              {errors.order?.message && (
                <p className="text-sm text-destructive">
                  {errors.order.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="caption">Caption</Label>
            <Textarea
              id="caption"
              placeholder="A short note about this image."
              aria-invalid={!!errors.caption}
              disabled={isPending}
              wrap="soft"
              className="field-sizing-fixed min-h-24 max-w-full scrollbar-none wrap-anywhere"
              {...register("caption")}
            />
            {errors.caption?.message && (
              <p className="text-sm text-destructive">
                {errors.caption.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Optional detail shown on public gallery overlays."
              aria-invalid={!!errors.description}
              disabled={isPending}
              wrap="soft"
              className="field-sizing-fixed min-h-24 max-w-full scrollbar-none wrap-anywhere"
              {...register("description")}
            />
            {errors.description?.message && (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <SpinnerIcon
                  data-icon="inline-start"
                  className="animate-spin"
                />
              ) : isEdit ? (
                <PencilSimpleIcon data-icon="inline-start" />
              ) : (
                <PlusIcon data-icon="inline-start" />
              )}
              {isPending ? "Saving..." : isEdit ? "Save Changes" : "Add Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function GalleryDeleteButton({
  item,
  trigger,
}: {
  item: DashboardGalleryItem;
  trigger?: ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const label = item.caption || item.category || "this gallery item";

  const handleDelete = () => {
    startTransition(async () => {
      const result = await actionDeleteGalleryItem(item.id);

      if (result.success) {
        toast.success(result.message ?? "Gallery item deleted.");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {trigger ?? (
          <Button type="button" size="sm" variant="destructive">
            <TrashIcon data-icon="inline-start" />
            Delete
          </Button>
        )}
      </AlertDialogTrigger>
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

function GalleryStatCard({
  label,
  value,
  icon,
  className,
  iconClassName,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  className?: string;
  iconClassName?: string;
}) {
  return (
    <Card className={dashboardStyles.statCard}>
      <CardContent className={dashboardStyles.statContent}>
        <div className={cn(dashboardStyles.statIcon, iconClassName)}>
          {icon}
        </div>
        <div>
          <p className={cn("font-heading text-xl font-bold", className)}>
            {value}
          </p>
          <p className="text-[11px] text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function FilterDropdown({
  label,
  value,
  displayValue,
  options,
  onValueChange,
}: {
  label: string;
  value: string;
  displayValue: string;
  options: Array<{ value: string; label: string }>;
  onValueChange: (value: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-11 min-w-0 justify-between rounded-2xl bg-input/35 px-3"
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
        <DropdownMenuRadioGroup value={value} onValueChange={onValueChange}>
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

function CompactFilterDropdown({
  label,
  value,
  displayValue,
  options,
  onValueChange,
}: {
  label: string;
  value: string;
  displayValue: string;
  options: Array<{ value: string; label: string }>;
  onValueChange: (value: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-w-0 flex-1 justify-between rounded-xl bg-input/35 px-3"
        >
          <span className="truncate text-xs">{displayValue || label}</span>
          <CaretDownIcon className="size-3.5 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuRadioGroup value={value} onValueChange={onValueChange}>
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

function GalleryGrid({
  items,
  batchMode,
  selectedIds,
  onSelectItem,
  onToggleItem,
}: {
  items: DashboardGalleryItem[];
  batchMode: boolean;
  selectedIds: Set<string>;
  onSelectItem: (item: DashboardGalleryItem) => void;
  onToggleItem: (id: string) => void;
}) {
  return (
    <div className={dashboardStyles.gridCards}>
      {items.map((item) => (
        <article
          key={item.id}
          className={cn(
            "group min-w-0 overflow-hidden rounded-2xl border border-border/70 bg-background/45 transition-[border-color,transform,box-shadow] hover:-translate-y-0.5 hover:border-brand-soft/40 hover:shadow-[0_20px_70px_rgba(0,0,0,0.22)]",
            selectedIds.has(item.id) && "border-brand-soft/60 bg-brand/5",
            batchMode && "cursor-pointer",
          )}
          onClick={batchMode ? () => onToggleItem(item.id) : undefined}
        >
          <div className="relative aspect-video overflow-hidden bg-muted/35">
            <button
              type="button"
              className={cn(
                "absolute inset-0 block w-full text-left",
                batchMode ? "pointer-events-none" : "md:pointer-events-none",
              )}
              onClick={(event) =>
                blurBeforeOpen(event, () => onSelectItem(item))
              }
              aria-label={`Open details for ${getItemTitle(item)}`}
            >
              <GalleryThumbnail
                imageUrl={item.imageUrl}
                caption={item.caption}
              />
            </button>
            {batchMode && (
              <div
                className="absolute top-3 left-3 z-10"
                onClick={(event) => event.stopPropagation()}
              >
                <Checkbox
                  checked={selectedIds.has(item.id)}
                  onCheckedChange={() => onToggleItem(item.id)}
                  aria-label={`Select ${getItemTitle(item)}`}
                />
              </div>
            )}
            <div
              className="absolute top-3 right-3"
              onClick={(event) => event.stopPropagation()}
            >
              <GalleryItemActions item={item} />
            </div>
          </div>
          <div className="relative">
            <div className="flex min-h-36 flex-col px-4 pt-3 pb-4">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <GalleryStatusBadge isVisible={item.isVisible} />
                {item.category && (
                  <Badge
                    variant="secondary"
                    className="max-w-full min-w-0 truncate"
                  >
                    {item.category}
                  </Badge>
                )}
              </div>
              <h2 className="mt-2 line-clamp-3 font-heading text-base leading-snug font-semibold wrap-break-word">
                {getItemTitle(item)}
              </h2>
              <p className="mt-auto flex items-center gap-1.5 pt-4 text-xs text-muted-foreground">
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

function GalleryListRow({
  item,
  handle,
  isDragging,
  batchMode,
  selected,
  onSelectItem,
  onToggleItem,
}: {
  item: DashboardGalleryItem;
  handle: ReactNode;
  isDragging: boolean;
  batchMode: boolean;
  selected: boolean;
  onSelectItem: (item: DashboardGalleryItem) => void;
  onToggleItem: (id: string) => void;
}) {
  return (
    <div
      className={cn(
        "grid min-w-0 grid-cols-[44px_minmax(0,1fr)] xl:grid-cols-[44px_minmax(280px,1fr)_120px_150px_80px_130px_64px]",
        dashboardStyles.listRow,
        selected && "border-brand-soft/60 bg-brand/5",
        batchMode && "cursor-pointer",
        isDragging && "relative z-10 bg-background/70 opacity-80",
      )}
      onClick={batchMode ? () => onToggleItem(item.id) : undefined}
    >
      <div className="row-span-2 xl:row-span-1">
        {batchMode ? (
          <div
            className="flex h-full min-h-20 items-center justify-center border-r border-border/50"
            onClick={(event) => event.stopPropagation()}
          >
            <Checkbox
              checked={selected}
              onCheckedChange={() => onToggleItem(item.id)}
              aria-label={`Select ${getItemTitle(item)}`}
            />
          </div>
        ) : (
          handle
        )}
      </div>
      <button
        type="button"
        className="flex min-w-0 items-center gap-3 p-3 text-left disabled:cursor-pointer"
        disabled={batchMode}
        onClick={(event) => blurBeforeOpen(event, () => onSelectItem(item))}
      >
        <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-xl border border-border/50 bg-muted/35">
          <GalleryThumbnail
            imageUrl={item.imageUrl}
            caption={item.caption}
            imageClassName="object-cover"
          />
        </div>
        <div className="min-w-0">
          <p className="line-clamp-2 leading-snug font-medium wrap-break-word">
            {getItemTitle(item)}
          </p>
          <p className="mt-1 truncate text-xs text-muted-foreground xl:hidden">
            {item.category || "Uncategorized"} · order {item.order}
          </p>
        </div>
      </button>
      <div className="hidden items-center p-3 xl:flex">
        <GalleryStatusBadge isVisible={item.isVisible} />
      </div>
      <div className="hidden min-w-0 items-center p-3 xl:flex">
        <Badge variant="secondary" className="max-w-full min-w-0 truncate">
          {item.category || "Uncategorized"}
        </Badge>
      </div>
      <div className="hidden items-center p-3 text-sm text-muted-foreground xl:flex">
        {item.order}
      </div>
      <div className="hidden items-center p-3 text-sm text-muted-foreground xl:flex">
        {formatDate(item.createdAt)}
      </div>
      <div className="col-start-2 flex items-center gap-2 px-3 pb-3 xl:col-auto xl:p-3 xl:pl-0">
        <div className="flex flex-wrap items-center gap-2 xl:hidden">
          <GalleryStatusBadge isVisible={item.isVisible} />
          <span className="text-xs text-muted-foreground">
            {formatDate(item.createdAt)}
          </span>
        </div>
        <div className="ml-auto" onClick={(event) => event.stopPropagation()}>
          <GalleryItemActions item={item} />
        </div>
      </div>
    </div>
  );
}

function GalleryPagination({
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
          <ItemsPerPageDropdown
            value={itemsPerPage}
            options={itemsPerPageOptions}
            onValueChange={onItemsPerPageChange}
          />
        </div>
      </div>
      <div className="md:col-start-2">{pageControls}</div>
      <div className="hidden justify-end md:flex">
        <ItemsPerPageDropdown
          value={itemsPerPage}
          options={itemsPerPageOptions}
          onValueChange={onItemsPerPageChange}
          showLabel
        />
      </div>
    </div>
  );
}

function ItemsPerPageDropdown({
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

function GalleryBatchActionsBar({
  selectedCount,
  isPending,
  onShow,
  onHide,
  onDelete,
  onCancel,
}: {
  selectedCount: number;
  isPending: boolean;
  onShow: () => void;
  onHide: () => void;
  onDelete: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-border/70 bg-card/55 p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">
          {selectedCount} {selectedCount === 1 ? "item" : "items"} selected
        </p>
        <p className="text-xs text-muted-foreground">
          Drag ordering is paused while selecting gallery items.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
        <Button
          type="button"
          size="sm"
          className="rounded-xl"
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
          className="rounded-xl bg-input/35"
          disabled={isPending || selectedCount === 0}
          onClick={onHide}
        >
          <EyeSlashIcon data-icon="inline-start" />
          Hide
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              className="rounded-xl"
              disabled={isPending || selectedCount === 0}
            >
              <TrashIcon data-icon="inline-start" />
              Delete
            </Button>
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
          className="rounded-xl"
          disabled={isPending}
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

function GalleryMobileDetail({
  item,
  onClose,
}: {
  item: DashboardGalleryItem;
  onClose: () => void;
}) {
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
    { icon: <FolderIcon />, label: "Size", value: "Not stored" },
    { icon: <RulerIcon />, label: "Dimensions", value: getDimensions(item) },
  ];

  return (
    <Drawer open direction="bottom" onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[86vh] overflow-hidden p-0 before:inset-x-0! before:top-2! before:bottom-0! before:rounded-b-none!">
        <DrawerHeader className="sr-only p-0">
          <DrawerTitle>Gallery item detail</DrawerTitle>
          <DrawerDescription>
            Preview metadata and actions for {getItemTitle(item)}.
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pt-7">
          <div className="relative aspect-video overflow-hidden rounded-2xl border border-border bg-muted/35">
            <GalleryThumbnail imageUrl={item.imageUrl} caption={item.caption} />
          </div>
        </div>
        <div className="mt-4 px-4">
          <h3 className="font-heading text-xl leading-tight font-semibold">
            {getItemTitle(item)}
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            <GalleryStatusBadge isVisible={item.isVisible} />
            {item.category && (
              <Badge variant="secondary">{item.category}</Badge>
            )}
          </div>
        </div>
        <div className="mx-4 mt-4 grid grid-cols-2 gap-3 rounded-2xl border border-border/70 bg-card/50 p-3">
          {metadata.map((row) => (
            <div key={row.label} className="flex min-w-0 items-start gap-2">
              <span className="mt-0.5 text-muted-foreground [&_svg]:size-4">
                {row.icon}
              </span>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{row.label}</p>
                <p className="mt-0.5 line-clamp-2 text-sm font-medium wrap-anywhere">
                  {row.value}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-2 px-4 pb-4">
          <GalleryItemDialog
            item={item}
            trigger={
              <Button type="button" variant="secondary" className="w-full">
                <PencilSimpleIcon data-icon="inline-start" />
                Edit Item
              </Button>
            }
          />
          <GalleryDeleteButton
            item={item}
            trigger={
              <Button type="button" variant="destructive" className="w-full">
                <TrashIcon data-icon="inline-start" />
                Delete Item
              </Button>
            }
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export function GalleryManager({ items }: GalleryManagerProps) {
  const router = useRouter();
  const [isReordering, startReorderTransition] = useTransition();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [query, setQuery] = useState("");
  const [visibility, setVisibility] = useState<VisibilityFilter>("all");
  const [category, setCategory] = useState("all");
  const [sortMode, setSortMode] = useState<SortMode>("order-asc");
  const [itemsPerPage, setItemsPerPage] = useState<number>(
    getDefaultItemsPerPage("grid"),
  );
  const [page, setPage] = useState(1);
  const [batchMode, setBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBatchPending, startBatchTransition] = useTransition();
  const [selectedItem, setSelectedItem] = useState<DashboardGalleryItem | null>(
    null,
  );
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const desktopSearchInputRef = useRef<HTMLInputElement>(null);

  const categories = useMemo(
    () =>
      Array.from(
        new Set(items.map((item) => item.category).filter(Boolean)),
      ).sort((a, b) => String(a).localeCompare(String(b))),
    [items],
  );

  const stats = useMemo(
    () => ({
      total: items.length,
      visible: items.filter((item) => item.isVisible).length,
      hidden: items.filter((item) => !item.isVisible).length,
      categories: categories.length,
    }),
    [categories.length, items],
  );

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return [...items]
      .filter((item) => {
        if (visibility === "visible" && !item.isVisible) {
          return false;
        }

        if (visibility === "hidden" && item.isVisible) {
          return false;
        }

        if (category !== "all" && item.category !== category) {
          return false;
        }

        if (!normalizedQuery) {
          return true;
        }

        return [
          item.caption,
          item.description,
          item.altText,
          item.category,
          getFileName(item.imageUrl),
        ]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(normalizedQuery),
          );
      })
      .sort((a, b) => {
        if (sortMode === "order-desc") {
          return b.order - a.order;
        }

        if (sortMode === "created-desc") {
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }

        if (sortMode === "created-asc") {
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        }

        return a.order - b.order;
      });
  }, [category, items, query, sortMode, visibility]);

  const {
    items: paginatedItems,
    pageCount,
    currentPage,
    firstIndex,
    lastIndex,
  } = paginateItems(filteredItems, page, itemsPerPage);
  const itemsPerPageOptions = getItemsPerPageOptions(viewMode);

  useEffect(() => {
    setPage(1);
  }, [category, itemsPerPage, query, sortMode, visibility]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() !== "k" ||
        !(event.ctrlKey || event.metaKey)
      ) {
        return;
      }

      event.preventDefault();

      const isMobileViewport = window.matchMedia("(max-width: 767px)").matches;
      const input = isMobileViewport
        ? mobileSearchInputRef.current
        : desktopSearchInputRef.current;

      input?.focus();
      input?.select();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleViewModeChange = (nextViewMode: ViewMode) => {
    setViewMode(nextViewMode);
    setItemsPerPage(getDefaultItemsPerPage(nextViewMode));
  };

  const toggleBatchMode = () => {
    setBatchMode((current) => {
      if (current) {
        setSelectedIds(new Set());
      }

      return !current;
    });
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setBatchMode(false);
  };

  const toggleItemSelection = (id: string) => {
    setSelectedIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (nextIds.has(id)) {
        nextIds.delete(id);
      } else {
        nextIds.add(id);
      }

      return nextIds;
    });
  };

  const runBatchAction = (
    action: (itemIds: string[]) => Promise<ActionResult<{ count: number }>>,
    fallbackMessage: string,
  ) => {
    const itemIds = Array.from(selectedIds);

    if (itemIds.length === 0) {
      return;
    }

    startBatchTransition(async () => {
      const result = await action(itemIds);

      if (result.success) {
        toast.success(result.message ?? fallbackMessage);
        clearSelection();
        router.refresh();
        return;
      }

      toast.error(result.error);
    });
  };

  const handleReorder = (nextItems: DashboardGalleryItem[]) => {
    startReorderTransition(async () => {
      const result = await actionReorderGalleryItems(
        nextItems.map((item, index) => ({
          id: item.id,
          order: index,
        })),
      );

      if (result.success) {
        toast.success(result.message ?? "Gallery order updated.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className={dashboardStyles.page}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-heading text-3xl font-bold">Gallery</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Manage gallery images, visibility, categories, and display order.
          </p>
        </div>
        <GalleryItemDialog
          trigger={
            <Button
              size="icon"
              className="size-10 shrink-0 rounded-full md:h-9 md:w-auto md:rounded-3xl md:px-4"
            >
              <PlusIcon data-icon="inline-start" />
              <span className="sr-only md:not-sr-only">Add Gallery Item</span>
            </Button>
          }
        />
      </div>

      <div className={dashboardStyles.statGrid}>
        <GalleryStatCard
          label="Total Items"
          value={stats.total}
          icon={<ImageIcon />}
          className="text-sky-300"
          iconClassName="bg-sky-500/12 text-sky-300"
        />
        <GalleryStatCard
          label="Visible"
          value={stats.visible}
          icon={<EyeIcon />}
          className="text-emerald-300"
          iconClassName="bg-emerald-500/12 text-emerald-300"
        />
        <GalleryStatCard
          label="Hidden"
          value={stats.hidden}
          icon={<EyeSlashIcon />}
          className="text-fuchsia-300"
          iconClassName="bg-fuchsia-500/12 text-fuchsia-300"
        />
        <GalleryStatCard
          label="Categories"
          value={stats.categories}
          icon={<FolderIcon />}
          className="text-amber-300"
          iconClassName="bg-amber-500/12 text-amber-300"
        />
      </div>

      <Card className={dashboardStyles.toolbarCard}>
        <CardContent className={dashboardStyles.toolbarContent}>
          <div className="grid gap-3 md:hidden">
            <div className="relative min-w-0">
              <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={mobileSearchInputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search gallery items..."
                className="h-10 rounded-2xl bg-input/45 pr-14 pl-9"
                aria-label="Search gallery items"
              />
              <Kbd className="absolute top-1/2 right-2 -translate-y-1/2 border border-border/50 bg-background/60">
                ⌘ K
              </Kbd>
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <CompactFilterDropdown
                label="All"
                value={visibility}
                displayValue={
                  visibility === "visible"
                    ? "Visible"
                    : visibility === "hidden"
                      ? "Hidden"
                      : ""
                }
                onValueChange={(value) =>
                  setVisibility(value as VisibilityFilter)
                }
                options={[
                  { value: "all", label: "All" },
                  { value: "visible", label: "Visible" },
                  { value: "hidden", label: "Hidden" },
                ]}
              />
              <CompactFilterDropdown
                label="All category"
                value={category}
                displayValue={category === "all" ? "" : category}
                onValueChange={setCategory}
                options={[
                  { value: "all", label: "All Categories" },
                  ...categories.map((itemCategory) => ({
                    value: String(itemCategory),
                    label: String(itemCategory),
                  })),
                ]}
              />
              <div className="grid shrink-0 grid-cols-2 rounded-xl border border-border/60 bg-background/35 p-1">
                <Button
                  type="button"
                  size="icon"
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  className="size-8 rounded-lg"
                  onClick={() => handleViewModeChange("grid")}
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
                  onClick={() => handleViewModeChange("list")}
                  aria-label="List view"
                  aria-pressed={viewMode === "list"}
                >
                  <ListBulletsIcon />
                </Button>
              </div>
              <Button
                type="button"
                variant={batchMode ? "secondary" : "outline"}
                size="sm"
                className="h-10 shrink-0 rounded-xl bg-input/35"
                onClick={toggleBatchMode}
              >
                {batchMode ? "Cancel" : "Select"}
              </Button>
            </div>
          </div>

          <div className="hidden min-w-0 gap-3 md:grid md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_140px_170px_140px_auto_auto]">
            <div className="relative min-w-0 md:col-span-2 xl:col-span-1">
              <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={desktopSearchInputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search gallery items..."
                className="h-11 rounded-2xl bg-input/45 pr-14 pl-9"
                aria-label="Search gallery items"
              />
              <Kbd className="absolute top-1/2 right-2 -translate-y-1/2 border border-border/50 bg-background/60">
                ⌘ K
              </Kbd>
            </div>
            <FilterDropdown
              label="Visibility"
              value={visibility}
              displayValue={
                visibility === "all"
                  ? "All"
                  : visibility === "visible"
                    ? "Visible"
                    : "Hidden"
              }
              onValueChange={(value) =>
                setVisibility(value as VisibilityFilter)
              }
              options={[
                { value: "all", label: "All" },
                { value: "visible", label: "Visible" },
                { value: "hidden", label: "Hidden" },
              ]}
            />
            <FilterDropdown
              label="Category"
              value={category}
              displayValue={category === "all" ? "All Categories" : category}
              onValueChange={setCategory}
              options={[
                { value: "all", label: "All Categories" },
                ...categories.map((itemCategory) => ({
                  value: String(itemCategory),
                  label: String(itemCategory),
                })),
              ]}
            />
            <FilterDropdown
              label="Sort by"
              value={sortMode}
              displayValue={
                sortMode === "order-asc"
                  ? "Order (asc)"
                  : sortMode === "order-desc"
                    ? "Order (desc)"
                    : sortMode === "created-desc"
                      ? "Newest"
                      : "Oldest"
              }
              onValueChange={(value) => setSortMode(value as SortMode)}
              options={[
                { value: "order-asc", label: "Order (asc)" },
                { value: "order-desc", label: "Order (desc)" },
                { value: "created-desc", label: "Newest" },
                { value: "created-asc", label: "Oldest" },
              ]}
            />
            <div className="grid grid-cols-2 rounded-2xl border border-border/60 bg-background/35 p-1 md:justify-self-start xl:justify-self-auto">
              <Button
                type="button"
                size="icon"
                variant={viewMode === "grid" ? "default" : "ghost"}
                className="size-8 rounded-lg"
                onClick={() => handleViewModeChange("grid")}
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
                onClick={() => handleViewModeChange("list")}
                aria-label="List view"
                aria-pressed={viewMode === "list"}
              >
                <ListBulletsIcon />
              </Button>
            </div>
            <Button
              type="button"
              variant={batchMode ? "secondary" : "outline"}
              className="h-11 rounded-2xl bg-input/35"
              onClick={toggleBatchMode}
            >
              {batchMode ? "Cancel" : "Select"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className={dashboardStyles.toolbarCard}>
        <CardContent className={dashboardStyles.toolbarContent}>
          {batchMode && (
            <GalleryBatchActionsBar
              selectedCount={selectedIds.size}
              isPending={isBatchPending}
              onShow={() =>
                runBatchAction(actionShowGalleryItems, "Selected items shown.")
              }
              onHide={() =>
                runBatchAction(actionHideGalleryItems, "Selected items hidden.")
              }
              onDelete={() =>
                runBatchAction(
                  actionDeleteGalleryItems,
                  "Selected items deleted.",
                )
              }
              onCancel={clearSelection}
            />
          )}
          {items.length === 0 ? (
            <div className={dashboardStyles.emptyState}>
              <ImageIcon className="size-12 text-muted-foreground/50" />
              <div>
                <p className="font-medium">No gallery items yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add the first image and assign it to a category.
                </p>
              </div>
              <GalleryItemDialog
                trigger={
                  <Button>
                    <PlusIcon data-icon="inline-start" />
                    Add Gallery Item
                  </Button>
                }
              />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className={dashboardStyles.emptyState}>
              <MagnifyingGlassIcon className="size-11 text-muted-foreground/50" />
              <div>
                <p className="font-medium">No gallery items found</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try adjusting the search, visibility, or category filter.
                </p>
              </div>
            </div>
          ) : viewMode === "grid" ? (
            <GalleryGrid
              items={paginatedItems}
              batchMode={batchMode}
              selectedIds={selectedIds}
              onSelectItem={setSelectedItem}
              onToggleItem={toggleItemSelection}
            />
          ) : (
            <DashboardSortableList
              items={paginatedItems}
              disabled={isReordering || batchMode}
              className={dashboardStyles.sortableRows}
              strategy={verticalListSortingStrategy}
              onReorder={handleReorder}
              renderItem={({ item, handle, isDragging }) => (
                <GalleryListRow
                  item={item}
                  handle={handle}
                  isDragging={isDragging}
                  batchMode={batchMode}
                  selected={selectedIds.has(item.id)}
                  onSelectItem={setSelectedItem}
                  onToggleItem={toggleItemSelection}
                />
              )}
            />
          )}

          {filteredItems.length > 0 && (
            <GalleryPagination
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
        </CardContent>
      </Card>

      {selectedItem && (
        <GalleryMobileDetail
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}
