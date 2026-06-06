import { z } from "zod";

export const projectStatusSchema = z.enum(["draft", "published"]);

const optionalUrlSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined)
  .pipe(z.string().url("Use a valid URL").optional());

const normalizedStringArraySchema = z
  .preprocess((value) => {
    if (Array.isArray(value)) {
      return value;
    }

    if (typeof value === "string") {
      return value.split(",");
    }

    return [];
  }, z.array(z.string()))
  .transform((items) =>
    Array.from(
      new Map(
        items
          .map((item) => item.trim())
          .filter(Boolean)
          .map((item) => [item.toLowerCase(), item]),
      ).values(),
    ),
  );

const normalizedUrlArraySchema = normalizedStringArraySchema.pipe(
  z.array(z.string().url("Use valid screenshot URLs")),
);

export const screenshotItemSchema = z.object({
  id: z.string().optional(),
  imageUrl: z.string().url("Screenshot URL is required"),
  caption: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined),
  altText: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined),
  width: z.number().int().positive().optional().nullable(),
  height: z.number().int().positive().optional().nullable(),
  aspectRatio: z.number().positive().optional().nullable(),
  blurDataUrl: z.string().optional().nullable(),
  order: z.number().int().min(0).default(0),
});

export type ScreenshotItemInput = z.input<typeof screenshotItemSchema>;
export type ScreenshotItemValues = z.output<typeof screenshotItemSchema>;

const projectBaseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or fewer")
    .regex(/^[^<>]*$/, "Title cannot contain HTML tags"),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use lowercase letters, numbers, and hyphens only",
    ),
  description: z
    .string()
    .trim()
    .max(320, "Description must be 320 characters or fewer")
    .optional()
    .transform((value) => value || ""),
  content: z
    .string()
    .optional()
    .transform((value) => value ?? ""),
  coverImage: optionalUrlSchema,
  thumbnailImageUrl: optionalUrlSchema,
  ogImageUrl: optionalUrlSchema,
  liveUrl: optionalUrlSchema,
  githubUrl: optionalUrlSchema,
  order: z.coerce
    .number()
    .int("Display order must be a whole number")
    .min(0, "Display order cannot be negative")
    .optional()
    .transform((value) => value ?? 0),
  status: projectStatusSchema,
  isFeatured: z.boolean().optional().default(false),
  isClosedSource: z.boolean().optional().default(false),
});

export const projectFormSchema = projectBaseSchema
  .extend({
    structuredScreenshots: z.array(screenshotItemSchema).optional().default([]),
    techStack: z
      .string()
      .optional()
      .transform((value) => value ?? ""),
  })
  .superRefine((value, ctx) => {
    if (value.status === "published" && value.content.trim().length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["content"],
        message: "Content is required before publishing",
      });
    }
  });

export const projectActionSchema = projectBaseSchema
  .extend({
    structuredScreenshots: z.array(screenshotItemSchema).optional().default([]),
    techStack: normalizedStringArraySchema,
  })
  .superRefine((value, ctx) => {
    if (value.status === "published" && value.content.trim().length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["content"],
        message: "Content is required before publishing",
      });
    }
  });

export const projectReorderSchema = z.array(
  z.object({
    id: z.string().min(1),
    order: z.number().int().min(0),
  }),
);

export type ProjectFormInput = z.input<typeof projectFormSchema>;
export type ProjectFormValues = z.output<typeof projectFormSchema>;
export type ProjectActionInput = z.input<typeof projectActionSchema>;
export type ProjectActionValues = z.output<typeof projectActionSchema>;
