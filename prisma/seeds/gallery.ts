import type { PrismaClient } from "@/generated/prisma";

type SeedGalleryOptions = {
  db: PrismaClient;
};

const galleryItems = [
  {
    imageUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
    caption: "Warm interface reference with strong foreground contrast.",
    altText: "Warm interface reference with strong foreground contrast",
    category: "Interface",
    isVisible: true,
    order: 1,
  },
  {
    imageUrl: "https://res.cloudinary.com/demo/image/upload/cld-sample-2.jpg",
    caption: "A quiet composition for dark editorial sections.",
    altText: "Quiet dark editorial composition",
    category: "Moodboard",
    isVisible: true,
    order: 2,
  },
  {
    imageUrl: "https://res.cloudinary.com/demo/image/upload/cld-sample-3.jpg",
    caption: "Texture study for depth, light, and atmospheric surfaces.",
    altText: "Texture study with depth and atmospheric light",
    category: "Texture",
    isVisible: true,
    order: 3,
  },
  {
    imageUrl: "https://res.cloudinary.com/demo/image/upload/cld-sample-4.jpg",
    caption: "Color and contrast reference for gallery hover states.",
    altText: "Color and contrast gallery reference",
    category: "Moodboard",
    isVisible: true,
    order: 4,
  },
  {
    imageUrl: "https://res.cloudinary.com/demo/image/upload/cld-sample-5.jpg",
    caption: "Spatial rhythm study for responsive masonry layouts.",
    altText: "Spatial rhythm study for masonry layouts",
    category: "Process",
    isVisible: true,
    order: 5,
  },
  {
    imageUrl: "https://res.cloudinary.com/demo/image/upload/cld-sample.jpg",
    caption: "A wide visual anchor for project storytelling sections.",
    altText: "Wide visual anchor for project storytelling",
    category: "Interface",
    isVisible: true,
    order: 6,
  },
  {
    imageUrl: "https://res.cloudinary.com/demo/image/upload/coffee.jpg",
    caption: "Desk-side note from a long build session.",
    altText: "Coffee beside a desk during a build session",
    category: "Life",
    isVisible: true,
    order: 7,
  },
  {
    imageUrl: "https://res.cloudinary.com/demo/image/upload/ecommerce.jpg",
    caption: "Commerce UI reference with dense visual hierarchy.",
    altText: "Commerce interface with dense visual hierarchy",
    category: "Interface",
    isVisible: true,
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
