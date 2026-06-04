import { connection } from "next/server";
import { Suspense } from "react";
import { MediaLibraryClient } from "@/app/(dashboard)/dashboard/media/media-client";
import { db } from "@/lib/db";

async function getMedia() {
  return db.media.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      url: true,
      publicId: true,
      filename: true,
      size: true,
      format: true,
      createdAt: true,
    },
  });
}

function MediaFallback() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold">Media Library</h1>
        <p className="mt-2 text-muted-foreground">Loading media...</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={`skeleton-${i.toString()}`}
            className="aspect-square animate-pulse rounded-lg bg-muted"
          />
        ))}
      </div>
    </div>
  );
}

export default function MediaPage() {
  return (
    <Suspense fallback={<MediaFallback />}>
      <MediaContent />
    </Suspense>
  );
}

async function MediaContent() {
  await connection();
  const media = await getMedia();
  return <MediaLibraryClient initialMedia={media} />;
}
