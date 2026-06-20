"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ImageIcon,
  PencilSimpleIcon,
  PlusIcon,
  SpinnerIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState, useTransition } from "react";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  actionCreateGalleryItem,
  actionDeleteGalleryItem,
  actionReorderGalleryItems,
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
  rectSortingStrategy,
} from "@/features/dashboard/shared/components/sortable-list";
import { formatDate } from "@/lib/utils";

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
}: {
  imageUrl?: string | null;
  caption?: string | null;
}) {
  const [failed, setFailed] = useState(false);

  if (!imageUrl || failed) {
    return (
      <div className="flex h-full min-h-48 items-center justify-center bg-muted text-muted-foreground">
        <ImageIcon className="size-10" />
      </div>
    );
  }

  return (
    <Image
      src={imageUrl}
      alt={caption || "Gallery image"}
      fill
      className="object-contain"
      sizes="(max-width: 768px) 100vw, 360px"
      onError={() => setFailed(true)}
    />
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
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-xl">
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

function GalleryDeleteButton({ item }: { item: DashboardGalleryItem }) {
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
        <Button type="button" size="sm" variant="destructive">
          <TrashIcon data-icon="inline-start" />
          Delete
        </Button>
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

export function GalleryManager({ items }: GalleryManagerProps) {
  const router = useRouter();
  const [isReordering, startReorderTransition] = useTransition();

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
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle>Gallery Items</CardTitle>
            <CardDescription>
              {items.length} {items.length === 1 ? "item" : "items"} in the
              visual archive. Hidden items are not shown publicly.
            </CardDescription>
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
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed text-center">
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
        ) : (
          <DashboardSortableList
            items={items}
            disabled={isReordering}
            className="grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-3"
            strategy={rectSortingStrategy}
            onReorder={handleReorder}
            renderItem={({ item, handle, isDragging }) => (
              <div
                className={[
                  "grid h-122 grid-cols-[44px_minmax(0,1fr)] overflow-hidden rounded-2xl border bg-background/40 transition-[border-color,box-shadow,opacity]",
                  isDragging
                    ? "border-brand-soft/60 shadow-[0_0_52px_rgba(139,92,246,0.18)]"
                    : item.isVisible
                      ? "hover:border-brand-soft/35"
                      : "border-dashed opacity-65 hover:border-brand-soft/35 hover:opacity-100",
                ].join(" ")}
              >
                {handle}
                <div className="grid min-w-0 grid-rows-[auto_minmax(0,1fr)_auto]">
                  <div className="relative aspect-4/3 bg-muted/40">
                    <GalleryThumbnail
                      imageUrl={item.imageUrl}
                      caption={item.caption}
                    />
                  </div>
                  <div className="min-h-0 overflow-hidden px-4 pt-4">
                    <div className="flex min-w-0 items-center gap-2 overflow-hidden">
                      <Badge
                        variant={item.isVisible ? "default" : "outline"}
                        className="shrink-0"
                      >
                        {item.isVisible ? "Visible" : "Hidden"}
                      </Badge>
                      {item.category && (
                        <Badge
                          variant="secondary"
                          className="max-w-28 min-w-0 truncate"
                        >
                          {item.category}
                        </Badge>
                      )}
                      <Badge variant="outline" className="shrink-0">
                        order {item.order}
                      </Badge>
                    </div>
                    <h2 className="mt-3 line-clamp-2 font-heading text-lg leading-snug font-semibold wrap-break-word">
                      {item.caption || "Untitled image"}
                    </h2>
                    {(item.altText || item.description) && (
                      <p className="mt-2 line-clamp-2 text-sm leading-5 wrap-break-word text-muted-foreground">
                        {item.altText || item.description}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-muted-foreground">
                      Created {formatDate(item.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 px-4 pt-3 pb-4">
                    <GalleryItemDialog
                      item={item}
                      trigger={
                        <Button type="button" size="sm" variant="secondary">
                          <PencilSimpleIcon data-icon="inline-start" />
                          Edit
                        </Button>
                      }
                    />
                    <GalleryDeleteButton item={item} />
                  </div>
                </div>
              </div>
            )}
          />
        )}
      </CardContent>
    </Card>
  );
}
