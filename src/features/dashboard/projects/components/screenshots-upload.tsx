"use client";

import { CloudArrowUpIcon, ImageIcon, PlusIcon } from "@phosphor-icons/react";
import Image from "next/image";
import {
  type ChangeEvent,
  type DragEvent,
  useCallback,
  useId,
  useRef,
  useState,
} from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ScreenshotItemInput } from "@/features/dashboard/projects/validations";
import { ImageRemoveButton } from "@/features/dashboard/shared/components/image-remove-button";
import {
  DashboardSortableList,
  rectSortingStrategy,
} from "@/features/dashboard/shared/components/sortable-list";
import { uploadFile } from "@/features/dashboard/shared/utils/upload";
import { cn } from "@/lib/utils";

type SortableScreenshot = ScreenshotItemInput & {
  id: string;
};

type ScreenshotsUploadProps = {
  value?: ScreenshotItemInput[];
  onChange: (items: ScreenshotItemInput[]) => void;
  disabled?: boolean;
};

const MAX_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function ScreenshotsUpload({
  value = [],
  onChange,
  disabled,
}: ScreenshotsUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const uploading = useRef(false);
  const fieldId = useId();
  const latestValue = useRef(value);
  latestValue.current = value;

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      if (disabled || uploading.current) return;
      const nextFiles = Array.from(files);
      if (nextFiles.length === 0) {
        return;
      }

      setError(null);

      const invalidFile = nextFiles.find(
        (file) => !ACCEPTED_TYPES.includes(file.type),
      );
      if (invalidFile) {
        setError("Invalid file type. Use jpg, png, webp, or gif.");
        return;
      }

      const oversizedFile = nextFiles.find((file) => file.size > MAX_SIZE);
      if (oversizedFile) {
        setError("File too large. Maximum 10MB.");
        return;
      }

      uploading.current = true;
      setIsUploading(true);
      try {
        const newItems: ScreenshotItemInput[] = [];

        for (const file of nextFiles) {
          const data = await uploadFile(file);
          newItems.push({
            id: crypto.randomUUID(),
            imageUrl: data.url,
            caption: undefined,
            altText: undefined,
            width: data.width ?? undefined,
            height: data.height ?? undefined,
            aspectRatio: data.aspectRatio ?? undefined,
            blurDataUrl: data.blurDataUrl ?? undefined,
            order: value.length + newItems.length,
          });
        }

        onChange(
          [...latestValue.current, ...newItems].map((item, order) => ({
            ...item,
            order,
          })),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        uploading.current = false;
        setIsUploading(false);
      }
    },
    [disabled, onChange, value],
  );

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
      uploadFiles(event.dataTransfer.files);
    },
    [uploadFiles],
  );

  const handleFileSelect = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (event.target.files) {
        uploadFiles(event.target.files);
      }

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
    [uploadFiles],
  );

  const removeItem = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const updateCaption = (index: number, caption: string) => {
    const next = [...value];
    next[index] = { ...next[index], caption: caption || undefined };
    onChange(next);
  };

  const updateAltText = (index: number, altText: string) => {
    const next = [...value];
    next[index] = { ...next[index], altText: altText || undefined };
    onChange(next);
  };

  const sortableItems: SortableScreenshot[] = value.map((item, index) => ({
    ...item,
    id: item.id ?? `${item.imageUrl}:${index}`,
  }));

  return (
    <div className="flex flex-col gap-3">
      {sortableItems.length > 0 && (
        <DashboardSortableList
          items={sortableItems}
          disabled={disabled || isUploading}
          className="flex flex-col gap-3"
          strategy={rectSortingStrategy}
          getItemLabel={(item) =>
            item.altText ||
            item.caption ||
            `Screenshot ${value.findIndex((entry) => entry.imageUrl === item.imageUrl) + 1}`
          }
          handleVariant="rail"
          onReorder={(nextItems) =>
            onChange(
              nextItems.map((item, i) => ({
                id: item.id,
                imageUrl: item.imageUrl,
                caption: item.caption,
                altText: item.altText,
                width: item.width,
                height: item.height,
                aspectRatio: item.aspectRatio,
                blurDataUrl: item.blurDataUrl,
                order: i,
              })),
            )
          }
          renderItem={({ item, index, handle, isDragging: dragging }) => (
            <div
              className={cn(
                "group bg-background/40 border border-border rounded-lg overflow-hidden transition-[border-color,box-shadow,opacity]",
                dragging
                  ? "border-brand-soft/60 opacity-80"
                  : "hover:border-brand-soft/35",
              )}
            >
              <div className="grid grid-cols-[44px_minmax(0,1fr)]">
                <div className="flex self-stretch">{handle}</div>
                <div className="flex flex-col gap-0">
                  <div className="relative aspect-video overflow-hidden">
                    <Image
                      src={item.imageUrl}
                      alt={item.altText || item.caption || "Project screenshot"}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 340px"
                    />
                    <ImageRemoveButton
                      label={`Remove screenshot ${index + 1}`}
                      onRemove={() => removeItem(index)}
                      disabled={disabled || isUploading}
                    />
                    <div className="bottom-2 left-2 absolute bg-background/75 backdrop-blur px-2 py-1 border border-border/60 rounded-full text-muted-foreground text-xs">
                      {index + 1}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 p-3">
                    <Label htmlFor={`${fieldId}-${index}-caption`}>
                      Caption (optional)
                    </Label>
                    <Input
                      id={`${fieldId}-${index}-caption`}
                      placeholder="Describe this view"
                      value={item.caption ?? ""}
                      onChange={(e) => updateCaption(index, e.target.value)}
                      disabled={disabled || isUploading}
                      className="h-8 text-xs"
                    />
                    <Label htmlFor={`${fieldId}-${index}-alt`}>
                      Alt text (optional)
                    </Label>
                    <Input
                      id={`${fieldId}-${index}-alt`}
                      placeholder="Describe the image for screen readers"
                      value={item.altText ?? ""}
                      onChange={(e) => updateAltText(index, e.target.value)}
                      disabled={disabled || isUploading}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        />
      )}

      <div
        onDrop={handleDrop}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled && !uploading.current) setIsDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragging(false);
        }}
      >
        <button
          type="button"
          aria-label={isUploading ? "Uploading screenshots" : "Add screenshots"}
          aria-disabled={disabled || isUploading}
          onClick={() => {
            if (!disabled && !uploading.current) inputRef.current?.click();
          }}
          className={cn(
            "flex flex-col justify-center items-center gap-3 p-6 border-2 border-dashed rounded-lg w-full text-center transition-colors cursor-pointer",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-muted/30",
            (disabled || isUploading) && "cursor-not-allowed opacity-50",
          )}
        >
          {isUploading ? (
            <>
              <CloudArrowUpIcon className="size-9 text-primary animate-pulse" />
              <p className="text-muted-foreground text-sm">Uploading...</p>
            </>
          ) : value.length > 0 ? (
            <>
              <PlusIcon className="size-9 text-muted-foreground" />
              <p className="font-medium text-sm">Add screenshots</p>
            </>
          ) : (
            <>
              <ImageIcon className="size-9 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">
                  Drop screenshots here or click to upload
                </p>
                <p className="mt-1 text-muted-foreground text-xs">
                  JPG, PNG, WebP, GIF - max 10MB each
                </p>
              </div>
            </>
          )}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={handleFileSelect}
        disabled={disabled || isUploading}
      />

      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
