import type { Prisma } from "@/generated/prisma";
import {
  extractCloudinaryPublicId,
  getCloudinaryImageMetadata,
} from "@/lib/cloudinary";
import {
  computeAspectRatio,
  fetchRemoteImageBuffer,
  generateBlurDataUrl,
  inspectImageBuffer,
} from "@/lib/image-metadata";

export type ImageFields = {
  width: number | null;
  height: number | null;
  aspectRatio: number | null;
  blurDataUrl: string | null;
};

export type BackfillOptions = {
  dryRun: boolean;
  force: boolean;
  limit?: number;
};

export function parseBackfillOptions(args: string[]): BackfillOptions {
  const limitArg = args.find((arg) => arg.startsWith("--limit="));
  const limit = limitArg
    ? Number(limitArg.slice("--limit=".length))
    : undefined;
  if (limit !== undefined && (!Number.isInteger(limit) || limit <= 0)) {
    throw new Error("--limit must be a positive integer");
  }

  return {
    dryRun: args.includes("--dry-run"),
    force: args.includes("--force"),
    limit,
  };
}

export function assertBackfillEnvironment() {
  const required = [
    "DATABASE_URL",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
  ];
  const missing = required.filter((name) => !process.env[name]?.trim());
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }
}

export function isComplete(fields: ImageFields) {
  return Boolean(
    fields.width && fields.height && fields.aspectRatio && fields.blurDataUrl,
  );
}

export async function resolveImageFields(input: {
  url: string;
  publicId?: string | null;
  needsBlur: boolean;
}): Promise<Partial<ImageFields>> {
  const resolved: Partial<ImageFields> = {};
  const publicId = input.publicId || extractCloudinaryPublicId(input.url);

  if (publicId) {
    try {
      Object.assign(resolved, await getCloudinaryImageMetadata(publicId));
    } catch {
      // A deleted or inaccessible Cloudinary asset can still be fetched by URL.
    }
  }

  if (
    input.needsBlur ||
    !resolved.width ||
    !resolved.height ||
    !resolved.aspectRatio
  ) {
    const buffer = await fetchRemoteImageBuffer(input.url);
    const metadata = await inspectImageBuffer(buffer);
    resolved.width ||= metadata.width;
    resolved.height ||= metadata.height;
    resolved.aspectRatio ||= metadata.aspectRatio;
    if (input.needsBlur)
      resolved.blurDataUrl = await generateBlurDataUrl(buffer);
  }

  resolved.aspectRatio ||= computeAspectRatio(resolved.width, resolved.height);
  return resolved;
}

export function buildImageUpdate(
  current: ImageFields,
  resolved: Partial<ImageFields>,
  force: boolean,
): Prisma.MediaUpdateInput {
  const update: Prisma.MediaUpdateInput = {};
  for (const key of [
    "width",
    "height",
    "aspectRatio",
    "blurDataUrl",
  ] as const) {
    const value = resolved[key];
    if (value != null && (force || current[key] == null)) update[key] = value;
  }
  return update;
}
