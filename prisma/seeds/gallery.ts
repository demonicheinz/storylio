import type { PrismaClient } from "@/generated/prisma";

type SeedGalleryOptions = {
  db: PrismaClient;
};

const galleryItems = [
  {
    imageUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
    caption: "Warm interface reference with strong foreground contrast.",
    category: "Interface",
    order: 1,
  },
  {
    imageUrl: "https://res.cloudinary.com/demo/image/upload/cld-sample-2.jpg",
    caption: "A quiet composition for dark editorial sections.",
    category: "Moodboard",
    order: 2,
  },
  {
    imageUrl: "https://res.cloudinary.com/demo/image/upload/cld-sample-3.jpg",
    caption: "Texture study for depth, light, and atmospheric surfaces.",
    category: "Texture",
    order: 3,
  },
  {
    imageUrl: "https://res.cloudinary.com/demo/image/upload/cld-sample-4.jpg",
    caption: "Color and contrast reference for gallery hover states.",
    category: "Moodboard",
    order: 4,
  },
  {
    imageUrl: "https://res.cloudinary.com/demo/image/upload/cld-sample-5.jpg",
    caption: "Spatial rhythm study for responsive masonry layouts.",
    category: "Process",
    order: 5,
  },
  {
    imageUrl: "https://res.cloudinary.com/demo/image/upload/cld-sample.jpg",
    caption: "A wide visual anchor for project storytelling sections.",
    category: "Interface",
    order: 6,
  },
  {
    imageUrl: "https://res.cloudinary.com/demo/image/upload/coffee.jpg",
    caption: "Desk-side note from a long build session.",
    category: "Life",
    order: 7,
  },
  {
    imageUrl: "https://res.cloudinary.com/demo/image/upload/ecommerce.jpg",
    caption: "Commerce UI reference with dense visual hierarchy.",
    category: "Interface",
    order: 8,
  },
];

export async function seedGallery({ db }: SeedGalleryOptions) {
  const galleryCount = await db.galleryItem.count();

  if (galleryCount > 0) {
    console.log("Gallery items already exist");
    return;
  }

  await db.galleryItem.createMany({
    data: galleryItems,
  });

  console.log("Created sample gallery items");
}
