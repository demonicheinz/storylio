import { z } from "zod";

const optionalUrlSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined)
  .pipe(z.string().url("Use a valid URL").optional());

const optionalEmailSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined)
  .pipe(z.string().email("Use a valid email").optional());

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
  websiteUrl: optionalUrlSchema,
  publicEmail: optionalEmailSchema,
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

export const changeEmailActionSchema = z.object({
  newEmail: z
    .string()
    .trim()
    .min(1, "New email is required")
    .email("Enter a valid email address"),
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
export type ChangeEmailActionInput = z.input<typeof changeEmailActionSchema>;
