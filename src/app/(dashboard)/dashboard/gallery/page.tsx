import { connection } from "next/server";
import { GalleryManager } from "@/features/dashboard/gallery/components/gallery-item-form";
import { db } from "@/lib/db";

async function getGalleryItems() {
  const galleryItems = await db.galleryItem.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    select: {
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
    const mediaItems = await db.media.findMany({
      where: {
        url: {
          in: itemsWithoutSize.map((item) => item.imageUrl),
        },
      },
      select: {
        url: true,
        size: true,
      },
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

export default async function GalleryPage() {
  await connection();

  const items = await getGalleryItems();

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <GalleryManager
        items={items.map((item) => ({
          ...item,
          createdAt: item.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
