import { asc, desc, inArray } from "drizzle-orm";
import { connection } from "next/server";
import { GalleryManager } from "@/features/dashboard/gallery/components/gallery-item-form";
import { DashboardRouteBoundary } from "@/features/dashboard/shared/components/route-boundary";
import { db } from "@/lib/db";

async function getGalleryItems() {
  const galleryItems = await db.query.galleryItem.findMany({
    orderBy: (table) => [asc(table.order), desc(table.createdAt)],
    columns: {
      id: true,
      imageUrl: true,
      caption: true,
      category: true,
      description: true,
      altText: true,
      width: true,
      height: true,
      size: true,
      aspectRatio: true,
      blurDataUrl: true,
      isVisible: true,
      order: true,
      createdAt: true,
    },
  });
  const itemsWithoutSize = galleryItems.filter((item) => item.size === null);

  const mediaSizeByUrl = new Map<string, number | null>();
  if (itemsWithoutSize.length > 0) {
    const mediaItems = await db.query.media.findMany({
      where: (table) =>
        inArray(
          table.url,
          itemsWithoutSize.map((item) => item.imageUrl),
        ),
      columns: { url: true, size: true },
    });
    for (const media of mediaItems) {
      mediaSizeByUrl.set(media.url, media.size);
    }
  }

  return galleryItems.map((item) => ({
    ...item,
    size: item.size ?? mediaSizeByUrl.get(item.imageUrl) ?? null,
  }));
}

export default function GalleryPage() {
  return (
    <DashboardRouteBoundary title="Gallery">
      <GalleryContent />
    </DashboardRouteBoundary>
  );
}

async function GalleryContent() {
  await connection();

  const items = await getGalleryItems();

  return (
    <div className="flex flex-col gap-6 min-w-0">
      <GalleryManager
        items={items.map((item) => ({
          ...item,
          createdAt: item.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
