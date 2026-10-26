"use client";

import { ImageIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { MasonryPhotoAlbum } from "react-photo-album";
import Lightbox from "yet-another-react-lightbox";
import page from "@/components/public/public-page.module.css";
import styles from "./gallery.module.css";
import type { GalleryPhoto } from "./types";

type GalleryExperienceProps = {
  photos: GalleryPhoto[];
  categories: string[];
  selectedCategory?: string;
};

function formatGallerySummary(photosCount: number, selectedCategory: string) {
  const noun = photosCount === 1 ? "frame" : "frames";

  if (selectedCategory === "All") {
    return `Showing ${photosCount} ${noun} across all categories`;
  }

  return `Showing ${photosCount} ${noun} in ${selectedCategory}`;
}

export function GalleryExperience({
  photos,
  categories,
  selectedCategory,
}: GalleryExperienceProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategory = selectedCategory ?? "All";
  const [activeIndex, setActiveIndex] = useState(-1);

  const filteredPhotos = useMemo(
    () =>
      activeCategory === "All"
        ? photos
        : photos.filter((photo) => photo.category === activeCategory),
    [photos, activeCategory],
  );
  const slides = useMemo(
    () =>
      filteredPhotos.map((photo) => ({
        src: photo.src,
        alt: photo.alt,
        width: photo.width,
        height: photo.height,
        description: photo.description,
      })),
    [filteredPhotos],
  );
  const activePhoto = activeIndex >= 0 ? filteredPhotos[activeIndex] : null;

  const updateFilter = (category?: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (category) {
      params.set("category", category);
    } else {
      params.delete("category");
    }

    const query = params.toString();

    setActiveIndex(-1);
    router.push(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  return (
    <section className="pb-14 md:pb-16">
      <nav className={page.filters} aria-label="Filter gallery by category">
        {["All", ...categories].map((category) => (
          <button
            key={category}
            type="button"
            className={page.filter}
            aria-pressed={category === activeCategory}
            onClick={() =>
              updateFilter(category === "All" ? undefined : category)
            }
          >
            {category}
          </button>
        ))}
      </nav>
      <div className={page.summary}>
        <p>{formatGallerySummary(filteredPhotos.length, activeCategory)}</p>
        {activeCategory !== "All" && (
          <button
            type="button"
            className={page.link}
            onClick={() => updateFilter()}
          >
            Reset category
          </button>
        )}
      </div>
      {filteredPhotos.length > 0 ? (
        <div className="pt-8 md:pt-10 w-full">
          <MasonryPhotoAlbum
            photos={filteredPhotos}
            columns={(containerWidth) => {
              if (containerWidth < 640) return 1;
              if (containerWidth < 1024) return 2;
              return 3;
            }}
            spacing={(containerWidth) => (containerWidth < 640 ? 16 : 24)}
            defaultContainerWidth={1280}
            sizes={{
              size: "100vw",
              sizes: [
                { viewport: "(min-width: 1280px)", size: "1280px" },
                { viewport: "(min-width: 768px)", size: "calc(100vw - 4rem)" },
              ],
            }}
            onClick={({ index }) => setActiveIndex(index)}
            render={{
              photo: ({ onClick }, { photo, width, height }) => (
                <GalleryPhotoCard
                  key={photo.id}
                  photo={photo}
                  width={width}
                  height={height}
                  priority={photo.id === filteredPhotos[0]?.id}
                  onClick={onClick}
                />
              ),
            }}
          />
        </div>
      ) : (
        <GalleryEmptyState selectedCategory={activeCategory} />
      )}

      <Lightbox
        open={activeIndex >= 0}
        close={() => setActiveIndex(-1)}
        index={activeIndex}
        slides={slides}
        carousel={{ finite: false, imageFit: "contain" }}
        controller={{ closeOnBackdropClick: true }}
        on={{ view: ({ index }) => setActiveIndex(index) }}
        render={{
          slideFooter: () =>
            activePhoto ? (
              <div className="bottom-0 absolute inset-x-0 pb-[max(1.25rem,env(safe-area-inset-bottom))] flex flex-col items-center gap-2 sm:gap-3 mx-auto px-4 sm:px-6 sm:pb-8 max-w-3xl text-center pointer-events-none">
                <div className="bg-background/95 px-4 sm:px-5 py-3 border border-border/40 rounded-2xl max-w-[calc(100vw-2rem)] sm:max-w-2xl">
                  {activePhoto.category && (
                    <p className="mb-2 text-muted-foreground text-xs">
                      {activePhoto.category}
                    </p>
                  )}
                  {activePhoto.caption && (
                    <p className="text-foreground text-xs sm:text-sm leading-5 sm:leading-6">
                      {activePhoto.caption}
                    </p>
                  )}
                  {activePhoto.description && (
                    <p className="mt-2 text-muted-foreground text-xs sm:text-sm leading-5 sm:leading-6">
                      {activePhoto.description}
                    </p>
                  )}
                </div>
              </div>
            ) : null,
        }}
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

  return (
    <button
      type="button"
      onClick={onClick}
      className={styles.photo}
      data-gallery-photo
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
          sizes="(min-width: 1280px) 360px, (min-width: 768px) 45vw, 100vw"
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
    </button>
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
function GalleryEmptyState({ selectedCategory }: { selectedCategory: string }) {
  return (
    <section className={page.empty}>
      <h2>
        {selectedCategory !== "All"
          ? "No frames in this category"
          : "No frames here yet"}
      </h2>
      <p>
        {selectedCategory !== "All"
          ? `There are no frames in ${selectedCategory}. Try another category or reset the filter.`
          : "New photographs will appear here when they’re ready to share."}
      </p>
    </section>
  );
}
