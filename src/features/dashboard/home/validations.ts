import { z } from "zod";

export const homeSectionTypeSchema = z.enum(["PHASE", "LOGO"]);

export const homeSectionActionSchema = z
  .object({
    type: homeSectionTypeSchema,
    label: z
      .string()
      .trim()
      .min(1, "Label is required")
      .max(120, "Label must be 120 characters or fewer"),
    content: z
      .string()
      .trim()
      .max(320, "Description must be 320 characters or fewer")
      .optional()
      .transform((value) => value || ""),
    imageUrl: z
      .string()
      .trim()
      .optional()
      .transform((value) => value || undefined)
      .pipe(z.string().url("Use a valid image URL").optional()),
    order: z.coerce
      .number()
      .int("Display order must be a whole number")
      .min(0, "Display order cannot be negative")
      .optional()
      .transform((value) => value ?? 0),
  })
  .superRefine((value, ctx) => {
    if (value.type === "LOGO" && !value.imageUrl) {
      ctx.addIssue({
        code: "custom",
        path: ["imageUrl"],
        message: "Logo image is required",
      });
    }
  });

export const homeSectionReorderSchema = z.array(
  z.object({
    id: z.string().min(1),
    order: z.number().int().min(0),
  }),
);

export type HomeSectionActionInput = z.input<typeof homeSectionActionSchema>;
export type HomeSectionActionValues = z.output<typeof homeSectionActionSchema>;
export type HomeSectionTypeValue = z.output<typeof homeSectionTypeSchema>;
