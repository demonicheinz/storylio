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
});

export const galleryReorderSchema = z.array(
  z.object({
    id: z.string().min(1),
    order: z.number().int().min(0),
  }),
);

export type GalleryItemActionInput = z.input<typeof galleryItemActionSchema>;
export type GalleryItemActionValues = z.output<typeof galleryItemActionSchema>;
