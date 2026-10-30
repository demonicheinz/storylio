"use client";

import { CloudArrowUpIcon, CropIcon, ImageIcon } from "@phosphor-icons/react";
import Image from "next/image";
import {
  type AriaAttributes,
  type ChangeEvent,
  type DragEvent,
  useCallback,
  useId,
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
import { ImageRemoveButton } from "@/features/dashboard/shared/components/image-remove-button";
import { uploadFile as uploadImageFile } from "@/features/dashboard/shared/utils/upload";
import { cn } from "@/lib/utils";

type ImageUploadProps = {
  value?: string;
  onChange: (
    url: string,
    metadata?: {
      width?: number | null;
      height?: number | null;
      size?: number | null;
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
  previewImageClassName?: string;
  priority?: boolean;
  maxSizeBytes?: number;
  maxSizeLabel?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: AriaAttributes["aria-invalid"];
  onUploadingChange?: (uploading: boolean) => void;
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
  previewImageClassName,
  priority = false,
  maxSizeBytes = MAX_SIZE,
  maxSizeLabel = "10MB",
  "aria-labelledby": labelledBy,
  "aria-describedby": describedBy,
  "aria-invalid": invalid,
  onUploadingChange,
}: ImageUploadProps) {
  const id = useId();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const uploading = useRef(false);
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

    if (file.size > maxSizeBytes) {
      return `File too large. Maximum ${maxSizeLabel}.`;
    }

    return null;
  };

  const uploadFile = useCallback(
    async (file: File) => {
      if (disabled || uploading.current) return;
      setError(null);

      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      uploading.current = true;
      setIsUploading(true);
      onUploadingChange?.(true);
      try {
        const data = await uploadImageFile(file);
        onChange(data.url, {
          width: data.width ?? null,
          height: data.height ?? null,
          size: data.size ?? null,
          aspectRatio: data.aspectRatio ?? null,
          blurDataUrl: data.blurDataUrl ?? null,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        uploading.current = false;
        setIsUploading(false);
        onUploadingChange?.(false);
      }
    },
    [onChange, disabled, onUploadingChange],
  );

  const prepareFile = useCallback(
    (file: File) => {
      if (disabled || uploading.current) return;
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
    [cropAspect, uploadFile, disabled],
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLButtonElement>) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled || uploading.current) return;

      const file = e.dataTransfer.files[0];
      if (file) {
        prepareFile(file);
      }
    },
    [prepareFile, disabled],
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!uploading.current) setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLButtonElement>) => {
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
      <div
        className={cn("relative", className)}
        role={labelledBy ? "group" : undefined}
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        aria-invalid={invalid}
      >
        <div
          className={cn(
            "relative border border-border rounded-lg w-full aspect-video overflow-hidden",
            cropShape === "round" && "aspect-square rounded-full",
            previewClassName,
          )}
        >
          <Image
            src={value}
            alt="Uploaded image"
            fill
            priority={priority}
            className={cn("object-cover", previewImageClassName)}
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
        {onRemove && (
          <ImageRemoveButton
            label="Remove image"
            disabled={disabled || isUploading}
            onRemove={onRemove}
          />
        )}
      </div>
    );
  }

  return (
    <div
      className={className}
      onDragOverCapture={(event) => event.preventDefault()}
      onDropCapture={(event) => event.preventDefault()}
    >
      <button
        type="button"
        aria-labelledby={labelledBy}
        aria-describedby={
          [describedBy, error ? `${id}-error` : undefined]
            .filter(Boolean)
            .join(" ") || undefined
        }
        aria-invalid={error ? true : invalid}
        aria-busy={isUploading}
        disabled={disabled || isUploading}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && !isUploading && inputRef.current?.click()}
        className={cn(
          "flex flex-col justify-center items-center gap-3 p-8 border-2 border-dashed rounded-lg focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 w-full transition-colors cursor-pointer",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/30",
          (disabled || isUploading) && "cursor-not-allowed opacity-50",
        )}
      >
        {isUploading ? (
          <>
            <CloudArrowUpIcon className="size-10 text-primary animate-pulse" />
            <span className="text-muted-foreground text-sm">Uploading...</span>
          </>
        ) : (
          <>
            <ImageIcon className="size-10 text-muted-foreground" />
            <span className="text-center">
              <span className="block font-medium text-sm">
                Drop an image here or click to upload
              </span>
              <span className="block mt-1 text-muted-foreground text-xs">
                JPG, PNG, WebP, GIF — max {maxSizeLabel}
              </span>
              {cropAspect && (
                <span className="inline-flex justify-center items-center gap-1 mt-1 text-brand-soft text-xs">
                  <CropIcon size={14} />
                  Crop available before upload
                </span>
              )}
            </span>
          </>
        )}
      </button>

      <input
        ref={inputRef}
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        aria-invalid={invalid}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileSelect}
        disabled={disabled || isUploading}
      />

      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-2 text-destructive text-sm"
        >
          {error}
        </p>
      )}

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

          <div className="relative bg-background border border-border rounded-3xl h-90 overflow-hidden">
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
              htmlFor={`${id}-crop-zoom`}
              className="font-medium text-foreground text-sm"
            >
              Zoom
            </label>
            <input
              id={`${id}-crop-zoom`}
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
