import { z } from "zod";

const optionalUrlSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined)
  .pipe(z.string().url("Use a valid URL").optional());

export const testimonialActionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(120, "Name must be 120 characters or fewer"),
  role: z
    .string()
    .trim()
    .max(120, "Role must be 120 characters or fewer")
    .optional()
    .transform((value) => value || ""),
  company: z
    .string()
    .trim()
    .max(120, "Company must be 120 characters or fewer")
    .optional()
    .transform((value) => value || ""),
  avatar: optionalUrlSchema,
  content: z
    .string()
    .trim()
    .min(1, "Quote is required")
    .max(800, "Quote must be 800 characters or fewer"),
  order: z.coerce
    .number()
    .int("Display order must be a whole number")
    .min(0, "Display order cannot be negative")
    .optional()
    .transform((value) => value ?? 0),
});

export const testimonialReorderSchema = z.array(
  z.object({
    id: z.string().min(1),
    order: z.number().int().min(0),
  }),
);

export type TestimonialActionInput = z.input<typeof testimonialActionSchema>;
export type TestimonialActionValues = z.output<typeof testimonialActionSchema>;
