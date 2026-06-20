import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isOwnerEmail } from "@/lib/owner-guard";

function getDownloadFilename(filename: string, format: string) {
  const trimmedFilename = filename.trim() || "media";
  const safeFilename = trimmedFilename.replace(/[\\/:*?"<>|\r\n]+/g, "-");
  const extension = format ? `.${format.toLowerCase()}` : "";

  return /\.[a-z0-9]+$/i.test(safeFilename)
    ? safeFilename
    : `${safeFilename}${extension}`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user || !isOwnerEmail(session.user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const media = await db.media.findUnique({
    where: { id },
    select: {
      url: true,
      filename: true,
      format: true,
    },
  });

  if (!media) {
    return NextResponse.json({ error: "Media not found" }, { status: 404 });
  }

  const response = await fetch(media.url, {
    cache: "no-store",
  });

  if (!response.ok || !response.body) {
    return NextResponse.json(
      { error: "Failed to fetch media" },
      { status: 502 },
    );
  }

  const contentType =
    response.headers.get("content-type") || "application/octet-stream";
  const contentLength = response.headers.get("content-length");
  const downloadFilename = getDownloadFilename(media.filename, media.format);
  const headers = new Headers({
    "Content-Disposition": `attachment; filename="${downloadFilename}"`,
    "Content-Type": contentType,
    "Cache-Control": "private, no-store",
  });

  if (contentLength) {
    headers.set("Content-Length", contentLength);
  }

  return new Response(response.body, { headers });
}
