"use client";

import {
  CloudArrowUpIcon,
  ImageIcon,
  PlusIcon,
  XIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import {
  type ChangeEvent,
  type DragEvent,
  useCallback,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import {
  DashboardSortableList,
  rectSortingStrategy,
} from "@/features/dashboard/shared/components/sortable-list";
import { cn } from "@/lib/utils";

type ScreenshotsUploadProps = {
  value?: string[];
  onChange: (urls: string[]) => void;
  disabled?: boolean;
};

type SortableScreenshot = {
  id: string;
  url: string;
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

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
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

      setIsUploading(true);
      try {
        const uploadedUrls: string[] = [];

        for (const file of nextFiles) {
          const formData = new FormData();
          formData.append("file", file);

          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "Upload failed");
          }

          const data = await response.json();
          uploadedUrls.push(data.url);
        }

        onChange([...value, ...uploadedUrls]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setIsUploading(false);
      }
    },
    [onChange, value],
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

  const removeUrl = (url: string) => {
    onChange(value.filter((item) => item !== url));
  };

  const screenshots = value.map(
    (url): SortableScreenshot => ({ id: url, url }),
  );

  return (
    <div className="flex flex-col gap-3">
      {value.length > 0 && (
        <DashboardSortableList
          items={screenshots}
          disabled={disabled || isUploading}
          className="grid grid-cols-2 gap-3"
          strategy={rectSortingStrategy}
          onReorder={(nextScreenshots) =>
            onChange(nextScreenshots.map((screenshot) => screenshot.url))
          }
          renderItem={({ item, index, handle, isDragging }) => (
            <div
              className={cn(
                "group grid overflow-hidden rounded-lg border border-border bg-background/40 transition-[border-color,box-shadow,opacity]",
                isDragging
                  ? "border-brand-soft/60 shadow-[0_0_36px_rgba(139,92,246,0.16)]"
                  : "hover:border-brand-soft/35",
              )}
            >
              <div className="grid grid-cols-[44px_minmax(0,1fr)]">
                {handle}
                <div className="relative aspect-video overflow-hidden">
                  <Image
                    src={item.url}
                    alt="Project screenshot"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 180px"
                  />
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="size-7 rounded-full"
                      onClick={() => removeUrl(item.url)}
                      disabled={disabled || isUploading}
                      aria-label="Remove screenshot"
                    >
                      <XIcon />
                    </Button>
                  </div>
                  <div className="absolute bottom-2 left-2 rounded-full border border-border/60 bg-background/75 px-2 py-1 text-xs text-muted-foreground backdrop-blur">
                    {index + 1}
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
          setIsDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragging(false);
        }}
        onClick={() => !disabled && !isUploading && inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (!disabled && !isUploading) {
              inputRef.current?.click();
            }
          }
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-6 text-center transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/30",
          (disabled || isUploading) && "cursor-not-allowed opacity-50",
        )}
      >
        {isUploading ? (
          <>
            <CloudArrowUpIcon className="size-9 animate-pulse text-primary" />
            <p className="text-sm text-muted-foreground">Uploading...</p>
          </>
        ) : value.length > 0 ? (
          <>
            <PlusIcon className="size-9 text-muted-foreground" />
            <p className="text-sm font-medium">Add screenshots</p>
          </>
        ) : (
          <>
            <ImageIcon className="size-9 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">
                Drop screenshots here or click to upload
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                JPG, PNG, WebP, GIF - max 10MB each
              </p>
            </div>
          </>
        )}
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

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
