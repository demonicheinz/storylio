import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import { PublicBackground } from "@/components/common";
import {
  GalleryExperience,
  GalleryHero,
  type GalleryPhoto,
} from "@/components/public/sections/gallery";
import { db } from "@/lib/db";

type GalleryPageProps = {
  searchParams: Promise<{
    category?: string | string[] | undefined;
  }>;
};

const aspectRatios = [
  { width: 1200, height: 1500 },
  { width: 1200, height: 900 },
  { width: 1200, height: 1600 },
  { width: 1200, height: 800 },
  { width: 1200, height: 1300 },
  { width: 1200, height: 1000 },
] as const;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Gallery",
    description:
      "A visual gallery of interface details, work-in-progress fragments, places, and moments from Heinz.",
    openGraph: {
      title: "Gallery",
      description:
        "Browse visual notes, interface details, and moments from the Storylio archive.",
      type: "website",
      images: ["/og?title=Gallery&type=page"],
    },
    twitter: {
      card: "summary_large_image",
      title: "Gallery",
      description:
        "A visual gallery of interface details, work-in-progress fragments, places, and moments from Heinz.",
      images: ["/og?title=Gallery&type=page"],
    },
  };
}

async function getGalleryData() {
  "use cache";
  cacheLife("hours");

  const items = await db.galleryItem.findMany({
    where: {
      isVisible: true,
    },
    select: {
      id: true,
      imageUrl: true,
      caption: true,
      category: true,
      description: true,
      altText: true,
      width: true,
      height: true,
      aspectRatio: true,
      blurDataUrl: true,
      isVisible: true,
      order: true,
      createdAt: true,
    },
    orderBy: [
      {
        order: "asc",
      },
      {
        createdAt: "desc",
      },
    ],
  });

  const photos: GalleryPhoto[] = items.map((item, index) => {
    const ratio = aspectRatios[index % aspectRatios.length];
    const width = item.width ?? ratio.width;
    const height =
      item.height ??
      (item.aspectRatio ? Math.round(width / item.aspectRatio) : ratio.height);

    return {
      ...item,
      src: item.imageUrl,
      alt: item.altText ?? item.caption ?? `Gallery image ${index + 1}`,
      width,
      height,
    };
  });
  const categories = Array.from(
    new Set(
      photos
        .map((photo) => photo.category)
        .filter((category): category is string => Boolean(category)),
    ),
  );

  return {
    photos,
    categories,
  };
}

function getSelectedCategory(value: string | string[] | undefined) {
  const category = Array.isArray(value) ? value[0] : value;

  return category?.trim() || undefined;
}

export default async function GalleryPage({ searchParams }: GalleryPageProps) {
  const selectedCategory = getSelectedCategory((await searchParams).category);
  const { photos, categories } = await getGalleryData();

  return (
    <main className="min-h-screen overflow-x-hidden">
      <PublicBackground variant="gallery" />

      <div className="relative mx-auto flex w-full max-w-[1180px] flex-col px-4 sm:px-6 lg:px-8">
        <GalleryHero
          totalItems={photos.length}
          totalCategories={categories.length}
        />
        <GalleryExperience
          photos={photos}
          categories={categories}
          selectedCategory={selectedCategory}
        />
      </div>
    </main>
  );
}
