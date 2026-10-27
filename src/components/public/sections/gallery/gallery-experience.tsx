"use client";

import { ImageIcon } from "@phosphor-icons/react";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useId, useMemo, useOptimistic, useState, useTransition } from "react";
import { MasonryPhotoAlbum } from "react-photo-album";
import page from "@/components/public/public-page.module.css";
import { buildGalleryFilterHref } from "@/lib/gallery-filters";
import styles from "./gallery.module.css";
import { GalleryFilters } from "./gallery-filters";
import { GalleryLightbox } from "./gallery-lightbox";
import type { GalleryPhoto } from "./types";

type GalleryExperienceProps = {
  photos: GalleryPhoto[];
  categories: string[];
  selectedCategory?: string;
};

export function GalleryExperience({
  photos,
  categories,
  selectedCategory,
}: GalleryExperienceProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [activeCategory, setActiveCategory] = useOptimistic(selectedCategory);
  const layoutId = useId();
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const filteredPhotos = useMemo(
    () =>
      !activeCategory
        ? photos
        : photos.filter((photo) => photo.category === activeCategory),
    [photos, activeCategory],
  );
  const updateFilter = (category?: string) => {
    setLightboxOpen(false);
    startTransition(() => {
      setActiveCategory(category);
      router.push(
        buildGalleryFilterHref(pathname, searchParams.toString(), category),
        {
          scroll: false,
        },
      );
    });
  };

  return (
    <section className="pb-14 md:pb-16">
      <GalleryFilters
        categories={categories}
        selectedCategory={activeCategory}
        resultCount={filteredPhotos.length}
        totalItems={photos.length}
        pending={pending}
        onChange={updateFilter}
      />
      {filteredPhotos.length > 0 ? (
        <div
          className={styles.collection}
          data-gallery-grid
          aria-busy={pending}
        >
          <LayoutGroup id={layoutId}>
            <MasonryPhotoAlbum
              photos={filteredPhotos}
              columns={(containerWidth) => {
                if (containerWidth < 640) return 1;
                if (containerWidth < 960) return 2;
                return 3;
              }}
              spacing={(containerWidth) => (containerWidth < 640 ? 16 : 24)}
              defaultContainerWidth={1280}
              sizes={{
                size: "calc(100vw - 32px)",
                sizes: [
                  { viewport: "(min-width: 1328px)", size: "1280px" },
                  {
                    viewport: "(min-width: 768px)",
                    size: "calc(100vw - 48px)",
                  },
                ],
              }}
              onClick={({ index }) => {
                setActiveIndex(index);
                setLightboxOpen(true);
              }}
              render={{
                photo: ({ onClick }, { photo, width, height, index }) => (
                  <GalleryPhotoCard
                    key={photo.id}
                    photo={photo}
                    width={width}
                    height={height}
                    priority={index < 3}
                    onClick={onClick}
                  />
                ),
              }}
            />
          </LayoutGroup>
        </div>
      ) : (
        <GalleryEmptyState selectedCategory={activeCategory} />
      )}

      <GalleryLightbox
        open={lightboxOpen}
        photos={filteredPhotos}
        index={activeIndex}
        onIndexChange={setActiveIndex}
        onClose={() => setLightboxOpen(false)}
      />
    </section>
  );
}

type GalleryPhotoCardProps = {
  photo: GalleryPhoto;
  width: number;
  height: number;
  onClick?: React.MouseEventHandler;
  priority?: boolean;
};

function GalleryPhotoCard({
  photo,
  width,
  height,
  onClick,
  priority = false,
}: GalleryPhotoCardProps) {
  const [hasImageError, setHasImageError] = useState(false);
  const reduce = useReducedMotion();

  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={styles.photo}
      data-gallery-photo
      data-photo-id={photo.id}
      layout={reduce ? false : "position"}
      layoutId={reduce ? undefined : photo.id}
      transition={{ layout: { duration: 0.24, ease: [0.22, 1, 0.36, 1] } }}
      style={{ width, height }}
      aria-label={photo.caption ?? photo.alt}
    >
      {hasImageError ? (
        <GalleryImageFallback caption={photo.caption} />
      ) : (
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          sizes="(min-width: 1328px) 411px, (min-width: 1008px) calc((100vw - 96px) / 3), (min-width: 768px) calc((100vw - 72px) / 2), (min-width: 672px) calc((100vw - 56px) / 2), calc(100vw - 32px)"
          fetchPriority={priority ? "high" : "auto"}
          loading={priority ? "eager" : "lazy"}
          className={styles.image}
          placeholder={photo.blurDataUrl ? "blur" : "empty"}
          blurDataURL={photo.blurDataUrl ?? undefined}
          onError={() => setHasImageError(true)}
        />
      )}
      {photo.caption && (
        <span className={styles.caption}>
          <span>{photo.caption}</span>
          {photo.category && (
            <span className={styles.category}>{photo.category}</span>
          )}
        </span>
      )}
    </motion.button>
  );
}

function GalleryImageFallback({ caption }: { caption: string | null }) {
  return (
    <div className={styles.fallback}>
      <ImageIcon size={24} aria-hidden="true" />
      <p>Image unavailable</p>
      {caption && <p>{caption}</p>}
    </div>
  );
}
function GalleryEmptyState({
  selectedCategory,
}: {
  selectedCategory?: string;
}) {
  return (
    <section className={page.empty}>
      <h2>
        {selectedCategory ? "No frames in this category" : "No frames here yet"}
      </h2>
      <p>
        {selectedCategory
          ? `There are no frames in ${selectedCategory}. Try another category or reset the filter.`
          : "New photographs will appear here when they’re ready to share."}
      </p>
    </section>
  );
}
