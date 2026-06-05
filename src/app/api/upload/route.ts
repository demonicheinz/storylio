import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { db } from "@/lib/db";
import { generateBlurDataUrl } from "@/lib/image-metadata";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(request: Request) {
  // Auth check
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user) {
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

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const [result, blurDataUrl] = await Promise.all([
      uploadToCloudinary(buffer),
      generateBlurDataUrl(buffer),
    ]);
    const aspectRatio =
      result.width > 0 && result.height > 0
        ? result.width / result.height
        : null;

    // Save media record to DB
    const media = await db.media.create({
      data: {
        url: result.url,
        publicId: result.publicId,
        filename: file.name,
        size: result.bytes,
        format: result.format,
        width: result.width || null,
        height: result.height || null,
        aspectRatio,
        blurDataUrl,
      },
    });

    revalidatePath("/dashboard/media");

    return NextResponse.json({
      id: media.id,
      url: media.url,
      publicId: media.publicId,
      filename: media.filename,
      format: media.format,
      size: media.size,
      width: result.width,
      height: result.height,
      aspectRatio,
      blurDataUrl: media.blurDataUrl,
    });
  } catch (error) {
    console.error("Upload failed:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
