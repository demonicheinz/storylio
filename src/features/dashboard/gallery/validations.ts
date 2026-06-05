import { z } from "zod";

export const galleryItemActionSchema = z.object({
  imageUrl: z
    .string()
    .trim()
    .min(1, "Image is required")
    .url("Use a valid image URL"),
  caption: z
    .string()
    .trim()
    .max(180, "Caption must be 180 characters or fewer")
    .optional()
    .transform((value) => value || ""),
  description: z
    .string()
    .trim()
    .max(500, "Description must be 500 characters or fewer")
    .optional()
    .transform((value) => value || ""),
  altText: z
    .string()
    .trim()
    .max(180, "Alt text must be 180 characters or fewer")
    .optional()
    .transform((value) => value || ""),
  category: z
    .string()
    .trim()
    .min(1, "Category is required")
    .max(80, "Category must be 80 characters or fewer"),
  order: z.coerce
    .number()
    .int("Display order must be a whole number")
    .min(0, "Display order cannot be negative")
    .optional()
    .transform((value) => value ?? 0),
  width: z.coerce.number().int().positive().optional(),
  height: z.coerce.number().int().positive().optional(),
  aspectRatio: z.coerce.number().positive().optional(),
  blurDataUrl: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined),
  isVisible: z.boolean().optional().default(true),
});

export const galleryReorderSchema = z.array(
  z.object({
    id: z.string().min(1),
    order: z.number().int().min(0),
  }),
);

export type GalleryItemActionInput = z.input<typeof galleryItemActionSchema>;
export type GalleryItemActionValues = z.output<typeof galleryItemActionSchema>;
