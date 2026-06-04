import { z } from "zod";

export const postStatusSchema = z.enum(["draft", "published"]);

const optionalUrlSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined)
  .pipe(z.string().url().optional());

const optionalDateSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined)
  .refine(
    (value) => !value || !Number.isNaN(new Date(value).getTime()),
    "Scheduled publish date is invalid",
  );

const normalizedTagsSchema = z
  .preprocess((value) => {
    if (Array.isArray(value)) {
      return value;
    }

    if (typeof value === "string") {
      return value.split(",");
    }

    return [];
  }, z.array(z.string()))
  .transform((tags) =>
    Array.from(
      new Map(
        tags
          .map((tag) => tag.trim().toLowerCase())
          .filter(Boolean)
          .map((tag) => [tag, tag]),
      ).values(),
    ),
  );

const postBaseSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use lowercase letters, numbers, and hyphens only",
    ),
  excerpt: z
    .string()
    .trim()
    .max(280, "Excerpt must be 280 characters or fewer")
    .optional()
    .transform((value) => value || ""),
  coverImage: optionalUrlSchema,
  status: postStatusSchema,
  scheduledPublishDate: optionalDateSchema,
  content: z
    .string()
    .optional()
    .transform((value) => value ?? ""),
});

export const postFormSchema = postBaseSchema
  .extend({
    tags: z
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

export const postActionSchema = postBaseSchema
  .extend({
    tags: normalizedTagsSchema,
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

export type PostFormValues = z.infer<typeof postFormSchema>;
export type PostFormInput = z.input<typeof postFormSchema>;
export type PostActionInput = z.input<typeof postActionSchema>;
export type PostActionValues = z.output<typeof postActionSchema>;
