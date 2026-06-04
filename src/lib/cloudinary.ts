import { v2 as cloudinary } from "cloudinary";

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
