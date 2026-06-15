"use client";

import {
  CloudArrowUpIcon,
  CropIcon,
  ImageIcon,
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
import Cropper, { type Area } from "react-easy-crop";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { uploadFile as uploadImageFile } from "@/features/dashboard/shared/utils/upload";
import { cn } from "@/lib/utils";

type ImageUploadProps = {
  value?: string;
  onChange: (
    url: string,
    metadata?: {
      width?: number | null;
      height?: number | null;
      aspectRatio?: number | null;
      blurDataUrl?: string | null;
    },
  ) => void;
  onRemove?: () => void;
  disabled?: boolean;
  className?: string;
  cropAspect?: number;
  cropShape?: "rect" | "round";
  cropLabel?: string;
  previewClassName?: string;
  priority?: boolean;
};

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const CROPPABLE_TYPES = ["image/jpeg", "image/png", "image/webp"];

function createImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", reject);
    image.src = src;
  });
}

async function getCroppedFile(
  imageSrc: string,
  pixelCrop: Area,
  fileName: string,
): Promise<File> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not prepare image crop.");
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  context.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not generate cropped image."));
          return;
        }

        resolve(
          new File([blob], fileName.replace(/\.[^.]+$/, ".webp"), {
            type: "image/webp",
          }),
        );
      },
      "image/webp",
      0.92,
    );
  });
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  disabled,
  className,
  cropAspect,
  cropShape = "rect",
  cropLabel = "Crop image",
  previewClassName,
  priority = false,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [cropSource, setCropSource] = useState<string | null>(null);
  const [pendingCropFile, setPendingCropFile] = useState<File | null>(null);
  const [cropFileName, setCropFileName] = useState("image.webp");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return "Invalid file type. Use jpg, png, webp, or gif.";
    }

    if (file.size > MAX_SIZE) {
      return "File too large. Maximum 10MB.";
    }

    return null;
  };

  const uploadFile = useCallback(
    async (file: File) => {
      setError(null);

      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setIsUploading(true);
      try {
        const data = await uploadImageFile(file);
        onChange(data.url, {
          width: data.width ?? null,
          height: data.height ?? null,
          aspectRatio: data.aspectRatio ?? null,
          blurDataUrl: data.blurDataUrl ?? null,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setIsUploading(false);
      }
    },
    [onChange],
  );

  const prepareFile = useCallback(
    (file: File) => {
      setError(null);

      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      if (cropAspect && CROPPABLE_TYPES.includes(file.type)) {
        const objectUrl = URL.createObjectURL(file);
        setCropSource((current) => {
          if (current) {
            URL.revokeObjectURL(current);
          }
          return objectUrl;
        });
        setPendingCropFile(file);
        setCropFileName(file.name);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCroppedAreaPixels(null);
        setCropDialogOpen(true);
        return;
      }

      uploadFile(file);
    },
    [cropAspect, uploadFile],
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        prepareFile(file);
      }
    },
    [prepareFile],
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
        prepareFile(file);
      }
      // Reset input so the same file can be re-selected
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
    [prepareFile],
  );

  const closeCropDialog = () => {
    setCropDialogOpen(false);
    setCropSource((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }
      return null;
    });
    setPendingCropFile(null);
  };

  const uploadOriginalImage = async () => {
    if (!pendingCropFile) {
      return;
    }

    const file = pendingCropFile;
    closeCropDialog();
    await uploadFile(file);
  };

  const uploadCroppedImage = async () => {
    if (!cropSource || !croppedAreaPixels) {
      return;
    }

    try {
      const file = await getCroppedFile(
        cropSource,
        croppedAreaPixels,
        cropFileName,
      );
      closeCropDialog();
      await uploadFile(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Crop failed");
    }
  };

  if (value) {
    return (
      <div className={cn("relative", className)}>
        <div
          className={cn(
            "relative aspect-video w-full overflow-hidden rounded-lg border border-border",
            cropShape === "round" && "aspect-square rounded-full",
            previewClassName,
          )}
        >
          <Image
            src={value}
            alt="Uploaded image"
            fill
            priority={priority}
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
        {onRemove && (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 size-7 rounded-full"
            onClick={onRemove}
            disabled={disabled}
          >
            <XIcon className="size-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && !isUploading && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!disabled && !isUploading) {
              inputRef.current?.click();
            }
          }
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/30",
          (disabled || isUploading) && "cursor-not-allowed opacity-50",
        )}
      >
        {isUploading ? (
          <>
            <CloudArrowUpIcon className="size-10 animate-pulse text-primary" />
            <p className="text-sm text-muted-foreground">Uploading...</p>
          </>
        ) : (
          <>
            <ImageIcon className="size-10 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm font-medium">
                Drop an image here or click to upload
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                JPG, PNG, WebP, GIF — max 10MB
              </p>
              {cropAspect && (
                <p className="mt-1 inline-flex items-center justify-center gap-1 text-xs text-brand-soft">
                  <CropIcon size={14} />
                  Crop available before upload
                </p>
              )}
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
        disabled={disabled || isUploading}
      />

      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

      <Dialog
        open={cropDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeCropDialog();
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{cropLabel}</DialogTitle>
            <DialogDescription>
              Adjust the frame, then upload the cropped image. Cancel keeps the
              original flow untouched.
            </DialogDescription>
          </DialogHeader>

          <div className="relative h-90 overflow-hidden rounded-3xl border border-border bg-background">
            {cropSource && (
              <Cropper
                image={cropSource}
                crop={crop}
                zoom={zoom}
                aspect={cropAspect}
                cropShape={cropShape}
                showGrid={cropShape !== "round"}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, areaPixels) =>
                  setCroppedAreaPixels(areaPixels)
                }
              />
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="image-crop-zoom"
              className="text-sm font-medium text-foreground"
            >
              Zoom
            </label>
            <input
              id="image-crop-zoom"
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="accent-primary"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={uploadOriginalImage}
            >
              Upload Original
            </Button>
            <Button type="button" onClick={uploadCroppedImage}>
              Upload Crop
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
