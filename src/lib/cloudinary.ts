import { v2 as cloudinary } from "cloudinary";
import { computeAspectRatio } from "@/lib/image-metadata";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function getCloudinaryFolder() {
  return process.env.CLOUDINARY_FOLDER?.trim() || "storylio";
}

/**
 * Uploads a file buffer to Cloudinary from the server.
 * Keep CLOUDINARY_API_SECRET server-only and never expose it to the client.
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  options?: {
    folder?: string;
    publicId?: string;
  },
): Promise<{
  url: string;
  publicId: string;
  format: string;
  bytes: number;
  width: number;
  height: number;
  originalFilename: string;
}> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: options?.folder ?? getCloudinaryFolder(),
          public_id: options?.publicId,
          resource_type: "image",
        },
        (error, result) => {
          if (error || !result) {
            reject(error ?? new Error("Upload failed"));
            return;
          }
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            bytes: result.bytes,
            width: result.width,
            height: result.height,
            originalFilename: result.original_filename,
          });
        },
      )
      .end(buffer);
  });
}

/**
 * Delete an asset from Cloudinary by its public_id.
 */
export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
  });

  return result.result === "ok";
}

export function extractCloudinaryPublicId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "res.cloudinary.com") return null;

    const uploadIndex = parsed.pathname.split("/").indexOf("upload");
    if (uploadIndex === -1) return null;

    const assetParts = parsed.pathname
      .split("/")
      .slice(uploadIndex + 1)
      .filter(Boolean);
    const versionIndex = assetParts.findIndex((part) => /^v\d+$/.test(part));
    const publicIdParts =
      versionIndex >= 0 ? assetParts.slice(versionIndex + 1) : assetParts;
    if (publicIdParts.length === 0) return null;

    const lastIndex = publicIdParts.length - 1;
    publicIdParts[lastIndex] = publicIdParts[lastIndex].replace(/\.[^.]+$/, "");
    return decodeURIComponent(publicIdParts.join("/"));
  } catch {
    return null;
  }
}

export async function getCloudinaryImageMetadata(publicId: string): Promise<{
  width: number | null;
  height: number | null;
  aspectRatio: number | null;
}> {
  const resource = await cloudinary.api.resource(publicId, {
    resource_type: "image",
  });
  const width = typeof resource.width === "number" ? resource.width : null;
  const height = typeof resource.height === "number" ? resource.height : null;

  return {
    width,
    height,
    aspectRatio: computeAspectRatio(width, height),
  };
}
