import { asc, desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { PublicRouteBoundary } from "@/components/common/public-route-boundary";
import styles from "@/components/public/public-page.module.css";
import {
  GalleryExperience,
  GalleryHero,
  type GalleryPhoto,
} from "@/components/public/sections/gallery";
import { db } from "@/lib/db";
import { PUBLIC_CACHE_TAGS } from "@/lib/public-cache-tags";
import { SITE_NAME } from "@/lib/site";

type GalleryPageProps = {
  searchParams: Promise<{
    category?: string | string[] | undefined;
  }>;
};

const fallbackImageDimensions = {
  width: 1200,
  height: 900,
} as const;

export const metadata: Metadata = {
  alternates: { canonical: "/gallery" },
  title: "Gallery — Storylio",
  description:
    "A visual gallery of interface details, work-in-progress fragments, places, and moments from Heinz.",
  openGraph: {
    siteName: SITE_NAME,
    url: "/gallery",
    title: "Gallery — Storylio",
    description:
      "Browse visual notes, interface details, and moments from the Storylio archive.",
    type: "website",
    images: ["/og?title=Gallery&type=page"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Gallery — Storylio",
    description:
      "A visual gallery of interface details, work-in-progress fragments, places, and moments from Heinz.",
    images: ["/og?title=Gallery&type=page"],
  },
};

async function getGalleryData() {
  "use cache";
  cacheLife("hours");
  cacheTag(PUBLIC_CACHE_TAGS.gallery);

  const items = await db.query.galleryItem.findMany({
    where: (table) => eq(table.isVisible, true),
    columns: {
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
    orderBy: (table) => [asc(table.order), desc(table.createdAt)],
  });

  const photos: GalleryPhoto[] = items.map((item, index) => {
    const width = item.width ?? fallbackImageDimensions.width;
    const height =
      item.height ??
      (item.aspectRatio
        ? Math.round(width / item.aspectRatio)
        : fallbackImageDimensions.height);

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

export default function GalleryPage(props: GalleryPageProps) {
  return (
    <PublicRouteBoundary variant="gallery">
      <GalleryContent {...props} />
    </PublicRouteBoundary>
  );
}

async function GalleryContent({ searchParams }: GalleryPageProps) {
  const selectedCategory = getSelectedCategory((await searchParams).category);
  const { photos, categories } = await getGalleryData();

  return (
    <main className={styles.page} data-public-page="gallery">
      <div className={styles.container}>
        <GalleryHero />
        <GalleryExperience
          photos={photos}
          categories={categories}
          selectedCategory={selectedCategory}
        />
      </div>
    </main>
  );
}
