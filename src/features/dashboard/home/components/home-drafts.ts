import { z } from "zod";
import type {
  HomeSectionActionValues,
  HomeSectionTypeValue,
} from "@/features/dashboard/home/validations";

const prefix = "storylio:home-draft:";
const heroKey = `${prefix}hero`;
const maxBytes = 16_384;
const headlineSchema = z.string().max(160);
// Drafts may be unfinished (including an invalid URL), but never arbitrary data.
const sectionSchema = z
  .object({
    type: z.enum(["PHASE", "LOGO"]),
    label: z.string().max(1000),
    content: z.string().max(4000).optional(),
    category: z.enum(["TECHNOLOGY", "CLIENT"]).optional(),
    showOnHome: z.boolean().optional(),
    imageUrl: z.string().max(2048).optional(),
    order: z
      .union([z.number().min(-1e9).max(1e9), z.string().max(32)])
      .optional(),
  })
  .strict();
const envelopeSchema = z
  .object({
    version: z.literal(1),
    base: z.string().max(8192),
    values: z.unknown(),
  })
  .strict();

export function clearHomeDraft(key: string) {
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* Storage may be disabled. */
  }
}

function readDraft<T>(
  key: string,
  base: string,
  schema: z.ZodType<T>,
): T | undefined {
  try {
    const raw = sessionStorage.getItem(key);
    if (raw === null) return;
    if (raw.length > maxBytes) {
      clearHomeDraft(key);
      return;
    }
    const entry = envelopeSchema.safeParse(JSON.parse(raw));
    if (entry.success && entry.data.base === base) {
      const values = schema.safeParse(entry.data.values);
      if (values.success) return values.data;
    }
    clearHomeDraft(key);
  } catch {
    clearHomeDraft(key);
  }
}

function writeDraft(key: string, base: string, values: unknown) {
  try {
    const raw = JSON.stringify({ version: 1, base, values });
    if (base.length <= 8192 && raw.length <= maxBytes)
      sessionStorage.setItem(key, raw);
    else clearHomeDraft(key);
  } catch {
    /* Editing still works without storage. */
  }
}

export function readHeroDraft(headline: string) {
  return readDraft(heroKey, JSON.stringify(headline), headlineSchema);
}

export function saveHeroDraft(headline: string, value: string) {
  if (value === headline || !headlineSchema.safeParse(value).success)
    clearHeroDraft();
  else writeDraft(heroKey, JSON.stringify(headline), value);
}

export function clearHeroDraft() {
  clearHomeDraft(heroKey);
}

export function homeSectionDraftKey(type: HomeSectionTypeValue, id?: string) {
  return `${prefix}${type}:${id ?? "new"}`;
}

function sectionBase(base: HomeSectionActionValues) {
  const parsed = sectionSchema.safeParse(base);
  return parsed.success ? JSON.stringify(parsed.data) : undefined;
}

export function readSectionDraft(key: string, base: HomeSectionActionValues) {
  const fingerprint = sectionBase(base);
  if (!fingerprint) {
    clearHomeDraft(key);
    return;
  }
  const draft = readDraft(key, fingerprint, sectionSchema);
  if (draft && draft.type === base.type) return draft;
  clearHomeDraft(key);
}

export function saveSectionDraft(
  key: string,
  base: HomeSectionActionValues,
  values: unknown,
) {
  const fingerprint = sectionBase(base);
  const parsed = sectionSchema.safeParse(values);
  if (
    !fingerprint ||
    !parsed.success ||
    parsed.data.type !== base.type ||
    JSON.stringify(parsed.data) === fingerprint
  )
    clearHomeDraft(key);
  else writeDraft(key, fingerprint, parsed.data);
}
