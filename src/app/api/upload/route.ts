import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deleteFromCloudinary, uploadToCloudinary } from "@/lib/cloudinary";
import { db } from "@/lib/db";
import { media as mediaTable } from "@/lib/db/schema";
import { generateBlurDataUrl } from "@/lib/image-metadata";
import { isOwnerEmail } from "@/lib/owner-guard";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user || !isOwnerEmail(session.user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Validate type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Invalid file type. Allowed: jpg, png, webp, gif" },
      { status: 400 },
    );
  }

  // Validate size
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "File too large. Maximum 10MB" },
      { status: 400 },
    );
  }

  let uploadedPublicId: string | undefined;
  let saved = false;
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const [result, blurDataUrl] = await Promise.all([
      uploadToCloudinary(buffer),
      generateBlurDataUrl(buffer).catch(() => null),
    ]);
    uploadedPublicId = result.publicId;
    const aspectRatio =
      result.width > 0 && result.height > 0
        ? result.width / result.height
        : null;

    // Save media record to DB
    const [media] = await db
      .insert(mediaTable)
      .values({
        url: result.url,
        publicId: result.publicId,
        filename: file.name,
        size: result.bytes,
        format: result.format,
        width: result.width || null,
        height: result.height || null,
        aspectRatio,
        blurDataUrl,
      })
      .returning();
    if (!media) throw new Error("Media record was not created");
    saved = true;

    try {
      revalidatePath("/dashboard/media");
    } catch {
      console.error("Media upload saved, but media page revalidation failed");
    }

    return NextResponse.json({
      id: media.id,
      url: media.url,
      publicId: media.publicId,
      filename: media.filename,
      format: media.format,
      size: media.size,
      width: media.width,
      height: media.height,
      aspectRatio: media.aspectRatio,
      blurDataUrl: media.blurDataUrl,
    });
  } catch {
    console.error("Media upload failed");
    if (uploadedPublicId && !saved) {
      let cleanedUp = false;
      try {
        cleanedUp = (await deleteFromCloudinary(uploadedPublicId)) === true;
      } catch {
        console.error("Media upload cleanup failed");
      }
      if (!cleanedUp) {
        return NextResponse.json(
          {
            error: `Upload was not saved and remote cleanup failed. Remove Cloudinary image ${uploadedPublicId} before retrying the upload.`,
          },
          { status: 500 },
        );
      }
      return NextResponse.json(
        {
          error:
            "Upload was not saved. The remote image was removed; retry the upload.",
        },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { error: "Upload failed. Retry the upload." },
      { status: 500 },
    );
  }
}
