import { z } from "zod";

export const aboutLanguageSchema = z.enum(["en", "id"]);

export const aboutContentActionSchema = z.object({
  introEn: z
    .string()
    .trim()
    .max(1200)
    .optional()
    .transform((value) => value || ""),
  introId: z
    .string()
    .trim()
    .max(1200)
    .optional()
    .transform((value) => value || ""),
  howIWorkEn: z
    .string()
    .max(20_000)
    .optional()
    .transform((value) => value || ""),
  howIWorkId: z
    .string()
    .max(20_000)
    .optional()
    .transform((value) => value || ""),
  whatIValueEn: z
    .string()
    .max(20_000)
    .optional()
    .transform((value) => value || ""),
  whatIValueId: z
    .string()
    .max(20_000)
    .optional()
    .transform((value) => value || ""),
  defaultLanguage: aboutLanguageSchema.optional().default("en"),
});

const optionalText = (max = 2000) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => value || "");
const common = {
  order: z.coerce
    .number()
    .int()
    .min(0)
    .optional()
    .transform((value) => value ?? 0),
  isVisible: z.boolean().optional().default(true),
};

export const workExperienceSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(160)
    .regex(/^[^<>]*$/, "Title cannot contain HTML tags"),
  company: optionalText(160),
  location: optionalText(160),
  type: optionalText(80),
  startDate: optionalText(40),
  endDate: optionalText(40),
  isCurrent: z.boolean().optional().default(false),
  descriptionEn: optionalText(),
  descriptionId: optionalText(),
  highlightsEn: optionalText(5000),
  highlightsId: optionalText(5000),
  ...common,
});
export const educationSchema = z.object({
  institution: z.string().trim().min(1, "Institution is required").max(200),
  degree: optionalText(160),
  field: optionalText(160),
  location: optionalText(160),
  startYear: optionalText(20),
  endYear: optionalText(20),
  descriptionEn: optionalText(),
  descriptionId: optionalText(),
  ...common,
});
export const skillCategorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required").max(120),
  descriptionEn: optionalText(1000),
  descriptionId: optionalText(1000),
  ...common,
});
export const skillSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().trim().min(1, "Skill name is required").max(120),
  level: optionalText(80),
  icon: optionalText(120),
  ...common,
});
export const aboutReorderSchema = z.array(
  z.object({ id: z.string().min(1), order: z.number().int().min(0) }),
);

export type AboutContentActionInput = z.input<typeof aboutContentActionSchema>;
export type AboutContentActionValues = z.output<
  typeof aboutContentActionSchema
>;
export type WorkExperienceInput = z.input<typeof workExperienceSchema>;
export type EducationInput = z.input<typeof educationSchema>;
export type SkillCategoryInput = z.input<typeof skillCategorySchema>;
export type SkillInput = z.input<typeof skillSchema>;
