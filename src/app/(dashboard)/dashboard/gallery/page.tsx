import { connection } from "next/server";
import { GalleryManager } from "@/features/dashboard/gallery/components/gallery-item-form";
import { db } from "@/lib/db";

async function getGalleryItems() {
  return db.galleryItem.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      imageUrl: true,
      caption: true,
      category: true,
      order: true,
      createdAt: true,
    },
  });
}

export default async function GalleryPage() {
  await connection();

  const items = await getGalleryItems();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-3xl font-bold">Gallery</h1>
        <p className="mt-2 text-muted-foreground">
          Manage gallery images, categories, captions, and manual display order.
        </p>
      </div>

      <GalleryManager
        items={items.map((item) => ({
          ...item,
          createdAt: item.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
