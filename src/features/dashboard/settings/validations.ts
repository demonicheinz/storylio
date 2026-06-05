import { z } from "zod";

const optionalUrlSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined)
  .pipe(z.string().url("Use a valid URL").optional());

export const profileSettingsActionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Display name is required")
    .max(120, "Display name must be 120 characters or fewer"),
  tagline: z
    .string()
    .trim()
    .max(160, "Tagline must be 160 characters or fewer")
    .optional()
    .transform((value) => value || ""),
  bio: z
    .string()
    .trim()
    .max(500, "Bio must be 500 characters or fewer")
    .optional()
    .transform((value) => value || ""),
  image: optionalUrlSchema,
  github: optionalUrlSchema,
  instagram: optionalUrlSchema,
  twitter: optionalUrlSchema,
});

export const accountPasswordActionSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters")
      .max(128, "New password must be 128 characters or fewer"),
    confirmPassword: z.string().min(1, "Confirm the new password"),
  })
  .superRefine((value, ctx) => {
    if (value.newPassword !== value.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords do not match",
      });
    }
  });

export const aboutLanguageSchema = z.enum(["en", "id"]);

export const aboutContentActionSchema = z.object({
  introEn: z
    .string()
    .trim()
    .max(1200, "English intro must be 1200 characters or fewer")
    .optional()
    .transform((value) => value || ""),
  introId: z
    .string()
    .trim()
    .max(1200, "Indonesia intro must be 1200 characters or fewer")
    .optional()
    .transform((value) => value || ""),
  howIWorkEn: z
    .string()
    .max(20_000, "English How I Work content is too long")
    .optional()
    .transform((value) => value || ""),
  howIWorkId: z
    .string()
    .max(20_000, "Indonesia How I Work content is too long")
    .optional()
    .transform((value) => value || ""),
  whatIValueEn: z
    .string()
    .max(20_000, "English What I Value content is too long")
    .optional()
    .transform((value) => value || ""),
  whatIValueId: z
    .string()
    .max(20_000, "Indonesia What I Value content is too long")
    .optional()
    .transform((value) => value || ""),
  defaultLanguage: aboutLanguageSchema.optional().default("en"),
});

export type ProfileSettingsActionInput = z.input<
  typeof profileSettingsActionSchema
>;
export type ProfileSettingsActionValues = z.output<
  typeof profileSettingsActionSchema
>;
export type AccountPasswordActionInput = z.input<
  typeof accountPasswordActionSchema
>;
export type AboutContentActionInput = z.input<typeof aboutContentActionSchema>;
export type AboutContentActionValues = z.output<
  typeof aboutContentActionSchema
>;
