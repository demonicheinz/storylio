import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { media as mediaTable } from "@/lib/db/schema";
import { isOwnerEmail } from "@/lib/owner-guard";

function errorResponse(error: string, status: number) {
  return NextResponse.json(
    { error },
    { status, headers: { "Cache-Control": "private, no-store" } },
  );
}

function getContentDisposition(filename: string, format: string) {
  if (/\p{Cc}/u.test(filename + format) || !/^[a-z0-9]*$/i.test(format)) {
    return null;
  }

  const trimmedFilename = filename.trim() || "media";
  const extension = format ? `.${format.toLowerCase()}` : "";
  const downloadFilename = /\.[a-z0-9]+$/i.test(trimmedFilename)
    ? trimmedFilename
    : `${trimmedFilename}${extension}`;
  const fallback = downloadFilename.replace(/[^a-zA-Z0-9._ -]+/g, "-");

  try {
    const encoded = encodeURIComponent(downloadFilename).replace(
      /['()*]/g,
      (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
    );
    return `attachment; filename="${fallback}"; filename*=UTF-8''${encoded}`;
  } catch {
    // Invalid Unicode (such as an unpaired surrogate) cannot be UTF-8 encoded.
    return null;
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user || !isOwnerEmail(session.user.email)) {
    return errorResponse("Unauthorized", 401);
  }

  const { id } = await params;
  const media = await db.query.media.findFirst({
    where: eq(mediaTable.id, id),
    columns: {
      url: true,
      filename: true,
      format: true,
    },
  });

  if (!media) {
    return errorResponse("Media not found", 404);
  }

  const contentDisposition = getContentDisposition(
    media.filename,
    media.format,
  );
  if (!contentDisposition) {
    return errorResponse(
      "This media has an invalid filename or format. Rename it or upload it again.",
      422,
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  let response: Response;
  try {
    response = await fetch(media.url, {
      cache: "no-store",
      signal: controller.signal,
    });
  } catch {
    return errorResponse(
      controller.signal.aborted
        ? "The media download timed out. Please try again."
        : "Unable to download this media right now. Please try again.",
      502,
    );
  } finally {
    // Limit the wait for headers without aborting the body while it streams.
    clearTimeout(timeout);
  }

  if (!response.ok || !response.body) {
    void response.body?.cancel().catch(() => {});
    return errorResponse(
      "Unable to download this media right now. Please try again.",
      502,
    );
  }

  const contentType =
    response.headers.get("content-type") || "application/octet-stream";
  const contentLength = response.headers.get("content-length");
  const headers = new Headers({
    "Content-Disposition": contentDisposition,
    "Content-Type": contentType,
    "Cache-Control": "private, no-store",
  });

  if (contentLength) {
    headers.set("Content-Length", contentLength);
  }

  return new Response(response.body, { headers });
}
