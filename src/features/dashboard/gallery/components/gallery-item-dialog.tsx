"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PencilSimpleIcon, PlusIcon, SpinnerIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { type ReactElement, useId, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
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
import { toast } from "@/components/ui/toast";
import {
  actionCreateGalleryItem,
  actionUpdateGalleryItem,
} from "@/features/dashboard/gallery/actions";
import {
  type GalleryItemActionInput,
  type GalleryItemActionValues,
  galleryItemActionSchema,
} from "@/features/dashboard/gallery/validations";
import { ImageUpload } from "@/features/dashboard/shared/components/image-upload";
import { confirmAction } from "@/features/dashboard/shared/confirmation";
import type { DashboardGalleryItem } from "../types";

type GalleryItemDialogProps = {
  item?: DashboardGalleryItem;
  trigger: ReactElement;
  triggerNativeButton?: boolean;
  categories?: readonly string[];
};

const emptyDefaults: GalleryItemActionValues = {
  imageUrl: "",
  caption: "",
  description: "",
  altText: "",
  category: "",
  width: undefined,
  height: undefined,
  size: undefined,
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
    size: item.size ?? undefined,
    aspectRatio: item.aspectRatio ?? undefined,
    blurDataUrl: item.blurDataUrl ?? undefined,
    isVisible: item.isVisible,
    order: item.order,
  };
}

export function GalleryItemDialog({
  item,
  trigger,
  triggerNativeButton = true,
  categories = [],
}: GalleryItemDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const id = useId();
  const [isPending, setIsPending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const pendingRef = useRef(false);
  const uploadingRef = useRef(false);
  const [failure, setFailure] = useState<string>();
  const busy = isPending || isUploading;
  const fieldId = (field: string) => `${id}-${field}`;

  const {
    formState: { errors, isDirty },
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

  const handleOpenChange = (
    nextOpen: boolean,
    details?: { cancel: () => void },
  ) => {
    if (pendingRef.current || uploadingRef.current) {
      details?.cancel();
      return;
    }
    if (!nextOpen && isDirty) {
      details?.cancel();
      void confirmAction("Discard unsaved changes to this gallery item?").then(
        (approved) => {
          if (approved && !pendingRef.current && !uploadingRef.current)
            setOpen(false);
        },
      );
      return;
    }
    if (nextOpen) {
      // Read the latest item on reopening; prop refreshes must not replace an open draft.
      reset(getDefaults(item));
      setFailure(undefined);
    }
    setOpen(nextOpen);
  };

  const onSubmit = handleSubmit(async (values) => {
    if (pendingRef.current || uploadingRef.current) return;
    pendingRef.current = true;
    setIsPending(true);
    setFailure(undefined);
    try {
      const result = item
        ? await actionUpdateGalleryItem(item.id, values)
        : await actionCreateGalleryItem(values);
      if (result.success) {
        toast.add({
          title:
            result.message ??
            (isEdit ? "Gallery item updated." : "Gallery item created."),
          type: "success",
        });
        reset(values);
        setOpen(false);
        router.refresh();
      } else {
        applyFieldErrors(result.fieldErrors);
        setFailure(result.error);
      }
    } catch {
      setFailure(
        "Could not save this gallery item. Your input is kept. Try again.",
      );
    } finally {
      pendingRef.current = false;
      setIsPending(false);
    }
  });

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      disablePointerDismissal={busy}
    >
      <DialogTrigger
        nativeButton={triggerNativeButton}
        role={triggerNativeButton ? undefined : "menuitem"}
        render={trigger}
      />
      <DialogContent className="sm:max-w-xl max-h-[calc(100vh-2rem)] overflow-y-auto scrollbar-none">
        <form
          className="flex flex-col gap-5"
          onSubmit={onSubmit}
          aria-busy={busy}
        >
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Edit Gallery Item" : "Add Gallery Item"}
            </DialogTitle>
            <DialogDescription>
              Upload an image and add its category and details.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <span id={fieldId("image-label")} className="font-medium text-sm">
              Image
            </span>
            <ImageUpload
              value={imageUrl}
              aria-labelledby={fieldId("image-label")}
              aria-describedby={
                errors.imageUrl ? fieldId("imageUrl-error") : undefined
              }
              aria-invalid={!!errors.imageUrl}
              onUploadingChange={(uploading) => {
                uploadingRef.current = uploading;
                setIsUploading(uploading);
              }}
              disabled={busy}
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
                setValue("size", metadata?.size ?? undefined, {
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
              <p
                id={fieldId("imageUrl-error")}
                className="text-destructive text-sm"
              >
                {errors.imageUrl.message}
              </p>
            )}
          </div>

          <div className="gap-4 grid sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor={fieldId("altText")}>Alt text</Label>
              <Input
                id={fieldId("altText")}
                maxLength={180}
                placeholder="Interface detail with dark cards"
                aria-invalid={!!errors.altText}
                aria-describedby={`${fieldId("altText-hint")} ${errors.altText ? fieldId("altText-error") : ""}`}
                disabled={busy}
                {...register("altText")}
              />
              <p
                id={fieldId("altText-hint")}
                className="text-muted-foreground text-xs"
              >
                {(watch("altText") ?? "").length}/180 characters
              </p>
              {errors.altText?.message && (
                <p
                  id={fieldId("altText-error")}
                  className="text-destructive text-sm"
                >
                  {errors.altText.message}
                </p>
              )}
            </div>

            <div className="flex justify-between items-start gap-4 pt-1 sm:pt-6">
              <div>
                <Label htmlFor={fieldId("isVisible")}>Visible publicly</Label>
                <p className="mt-1 text-muted-foreground text-xs leading-5">
                  Hidden items stay editable here but are not shown on the
                  public Gallery.
                </p>
              </div>
              <Switch
                id={fieldId("isVisible")}
                checked={watch("isVisible")}
                disabled={busy}
                onCheckedChange={(checked) =>
                  setValue("isVisible", checked, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor={fieldId("category")}>Category (required)</Label>
            <Input
              id={fieldId("category")}
              placeholder="Interface"
              list={fieldId("categories")}
              maxLength={80}
              aria-invalid={!!errors.category}
              aria-describedby={`${fieldId("category-hint")} ${errors.category ? fieldId("category-error") : ""}`}
              disabled={busy}
              {...register("category")}
            />
            <datalist id={fieldId("categories")}>
              {[...new Set(categories)].filter(Boolean).map((category) => (
                <option key={category} value={category} />
              ))}
            </datalist>
            <p
              id={fieldId("category-hint")}
              className="text-muted-foreground text-xs"
            >
              Choose an existing category or enter a new one. Maximum 80
              characters.
            </p>
            {errors.category?.message && (
              <p
                id={fieldId("category-error")}
                className="text-destructive text-sm"
              >
                {errors.category.message}
              </p>
            )}
          </div>
          <p className="text-muted-foreground text-xs">
            {isEdit
              ? "This item keeps its position."
              : "New images are added to the end."}{" "}
            Use Reorder in the gallery to change the sequence.
          </p>

          <div className="flex flex-col gap-2">
            <Label htmlFor={fieldId("caption")}>Caption</Label>
            <Textarea
              id={fieldId("caption")}
              maxLength={180}
              placeholder="A short note about this image."
              aria-invalid={!!errors.caption}
              aria-describedby={`${fieldId("caption-hint")} ${errors.caption ? fieldId("caption-error") : ""}`}
              disabled={busy}
              wrap="soft"
              className="max-w-full min-h-24 field-sizing-fixed scrollbar-none wrap-anywhere"
              {...register("caption")}
            />
            <p
              id={fieldId("caption-hint")}
              className="text-muted-foreground text-xs"
            >
              {(watch("caption") ?? "").length}/180 characters
            </p>
            {errors.caption?.message && (
              <p
                id={fieldId("caption-error")}
                className="text-destructive text-sm"
              >
                {errors.caption.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor={fieldId("description")}>Description</Label>
            <Textarea
              id={fieldId("description")}
              maxLength={500}
              placeholder="Optional detail shown on public gallery overlays."
              aria-invalid={!!errors.description}
              aria-describedby={`${fieldId("description-hint")} ${errors.description ? fieldId("description-error") : ""}`}
              disabled={busy}
              wrap="soft"
              className="max-w-full min-h-24 field-sizing-fixed scrollbar-none wrap-anywhere"
              {...register("description")}
            />
            <p
              id={fieldId("description-hint")}
              className="text-muted-foreground text-xs"
            >
              {(watch("description") ?? "").length}/500 characters
            </p>
            {errors.description?.message && (
              <p
                id={fieldId("description-error")}
                className="text-destructive text-sm"
              >
                {errors.description.message}
              </p>
            )}
          </div>

          {failure && (
            <p role="alert" className="text-destructive text-sm">
              {failure}
            </p>
          )}
          <DialogFooter className="bottom-0 z-10 sticky bg-popover py-4 border-border border-t">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
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
              {isPending
                ? "Saving..."
                : isUploading
                  ? "Uploading..."
                  : isEdit
                    ? "Save Changes"
                    : "Add Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
