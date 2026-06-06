"use client";

import {
  CloudArrowUpIcon,
  CopyIcon,
  ImageIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import {
  type ChangeEvent,
  type DragEvent,
  useCallback,
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
import { cn } from "@/lib/utils";
import { actionDeleteMedia } from "../actions";

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

const MAX_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaLibraryClient({ initialMedia }: MediaLibraryClientProps) {
  const [media, setMedia] = useState(initialMedia);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MediaItem | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

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

  const handleDelete = useCallback(() => {
    if (!deleteTarget) return;

    const targetId = deleteTarget.id;
    startTransition(async () => {
      const result = await actionDeleteMedia(targetId);
      if (result.success) {
        setMedia((prev) => prev.filter((m) => m.id !== targetId));
        toast.success("Media deleted");
      } else {
        toast.error(result.error);
      }
      setDeleteTarget(null);
    });
  }, [deleteTarget]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">Media Library</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {media.length} {media.length === 1 ? "file" : "files"} uploaded
          </p>
        </div>
        <Button
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
        >
          <CloudArrowUpIcon className="mr-2 size-4" />
          Upload
        </Button>
      </div>

      {/* Upload Drop Zone */}
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
          "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 transition-all duration-200",
          isDragging
            ? "border-primary bg-primary/5 shadow-[0_0_24px_-4px] shadow-primary/20"
            : "border-border hover:border-primary/50 hover:bg-muted/20",
          isUploading && "pointer-events-none opacity-50",
        )}
      >
        {isUploading ? (
          <>
            <CloudArrowUpIcon className="size-12 animate-pulse text-primary" />
            <p className="text-sm text-muted-foreground">Uploading...</p>
          </>
        ) : (
          <>
            <ImageIcon className="size-12 text-muted-foreground" />
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

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileSelect}
        disabled={isUploading}
      />

      {/* Media Grid */}
      {media.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16">
          <ImageIcon className="size-16 text-muted-foreground/40" />
          <p className="mt-4 text-sm text-muted-foreground">
            No media uploaded yet
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Upload your first image to get started
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {media.map((item) => (
            <div
              key={item.id}
              className="group relative overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-primary/30"
            >
              {/* Image preview */}
              <div className="relative aspect-square">
                <Image
                  src={item.url}
                  alt={item.filename}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                />

                {/* Hover overlay with actions */}
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 backdrop-blur-[2px] transition-opacity group-hover:opacity-100">
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="size-9"
                    onClick={() => handleCopyUrl(item.url)}
                  >
                    <CopyIcon className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="size-9"
                    onClick={() => setDeleteTarget(item)}
                    disabled={isPending}
                  >
                    <TrashIcon className="size-4" />
                  </Button>
                </div>
              </div>

              {/* File info */}
              <div className="space-y-1 p-3">
                <p className="truncate text-xs font-medium">{item.filename}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">
                    {item.format.toUpperCase()}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {formatBytes(item.size)}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                  <span>
                    {item.width && item.height
                      ? `${item.width} × ${item.height}`
                      : "Unknown dimensions"}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{item.blurDataUrl ? "Blur ready" : "No blur"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
              This will permanently delete{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.filename}
              </span>{" "}
              from Cloudinary and the database. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
