import { z } from "zod";

const text = (maximum: number) => z.string().trim().max(maximum).optional();
const url = z.string().trim().url("Use a valid URL").optional();
export const seedOwnerProfileSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Display name is required")
      .max(120)
      .optional(),
    tagline: text(160),
    headline: text(160),
    subheadline: text(500),
    github: url,
    instagram: url,
    twitter: url,
    websiteUrl: url,
    publicEmail: z.string().trim().email("Use a valid public email").optional(),
  })
  .strict();
export type SeedOwnerProfile = z.infer<typeof seedOwnerProfileSchema>;
