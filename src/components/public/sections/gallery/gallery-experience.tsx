"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { MasonryPhotoAlbum } from "react-photo-album";
import "react-photo-album/masonry.css";
import { ImageIcon } from "@phosphor-icons/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    <section className="pb-28">
      <div className="sticky top-20 z-20 -mx-4 border-y border-border/30 bg-background/80 px-4 py-4 backdrop-blur-xl sm:mx-0 sm:rounded-3xl sm:border sm:bg-surface/55">
        <div className="flex [scrollbar-width:none] gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
          {["All", ...categories].map((category) => {
            const isSelected = category === activeCategory;

            return (
              <Button
                key={category}
                type="button"
                variant={isSelected ? "default" : "outline"}
                size="sm"
                className="shrink-0 rounded-full"
                onClick={() =>
                  updateFilter(category === "All" ? undefined : category)
                }
              >
                {category}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <p>{formatGallerySummary(filteredPhotos.length, activeCategory)}</p>
        {activeCategory !== "All" && (
          <button
            type="button"
            className="text-brand-soft underline-offset-4 transition-colors hover:text-foreground hover:underline"
            onClick={() => updateFilter()}
          >
            Reset category
          </button>
        )}
      </div>

      {filteredPhotos.length > 0 ? (
        <div className="mt-8 w-full">
          <MasonryPhotoAlbum
            photos={filteredPhotos}
            columns={(containerWidth) => {
              if (containerWidth < 640) return 1;
              if (containerWidth < 1024) return 2;
              return 3;
            }}
            spacing={(containerWidth) => (containerWidth < 640 ? 14 : 18)}
            defaultContainerWidth={1120}
            sizes={{
              size: "100vw",
              sizes: [
                { viewport: "(min-width: 1280px)", size: "1120px" },
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
              <div className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto flex max-w-3xl flex-col items-center gap-2 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-center sm:gap-3 sm:px-6 sm:pb-8">
                <div className="max-w-[calc(100vw-2rem)] rounded-2xl border border-border/40 bg-background/75 px-4 py-3 shadow-[0_0_48px_rgba(139,92,246,0.14)] backdrop-blur-xl sm:max-w-2xl sm:px-5">
                  {activePhoto.category && (
                    <Badge className="mb-2 rounded-full bg-brand-soft/90 text-primary-foreground">
                      {activePhoto.category}
                    </Badge>
                  )}
                  {activePhoto.caption && (
                    <p className="text-xs leading-5 text-foreground sm:text-sm sm:leading-6">
                      {activePhoto.caption}
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
};

function GalleryPhotoCard({
  photo,
  width,
  height,
  onClick,
}: GalleryPhotoCardProps) {
  const [hasImageError, setHasImageError] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group/photo relative block overflow-hidden rounded-3xl border border-border/40 bg-surface/65 shadow-[0_0_48px_rgba(139,92,246,0.08)] transition-[border-color,box-shadow,transform] duration-300 outline-none hover:-translate-y-0.5 hover:border-brand-soft/45 hover:shadow-[0_0_64px_rgba(139,92,246,0.14)] focus-visible:ring-2 focus-visible:ring-brand-soft/60"
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
          className="object-cover transition-transform duration-500 group-hover/photo:scale-105"
          unoptimized
          onError={() => setHasImageError(true)}
        />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/85 via-background/8 to-transparent opacity-80 transition-opacity duration-300 group-hover/photo:opacity-95" />
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-4 text-left">
        {photo.category && (
          <Badge className="w-fit rounded-full bg-brand-soft/90 text-primary-foreground">
            {photo.category}
          </Badge>
        )}
        {photo.caption && (
          <p className="max-w-sm text-sm leading-6 font-medium text-foreground">
            {photo.caption}
          </p>
        )}
      </div>
    </button>
  );
}

function GalleryImageFallback({ caption }: { caption: string | null }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.26),transparent_36%),linear-gradient(135deg,rgba(14,12,26,0.96),rgba(31,26,54,0.78),rgba(10,10,20,0.98))] p-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl border border-brand-soft/30 bg-brand-soft/10 text-brand-soft shadow-[0_0_36px_rgba(139,92,246,0.18)]">
        <ImageIcon size={24} />
      </div>
      <p className="max-w-48 text-sm leading-6 text-muted-foreground">
        {caption ?? "This image could not be loaded."}
      </p>
    </div>
  );
}

function GalleryEmptyState({ selectedCategory }: { selectedCategory: string }) {
  const isFiltered = selectedCategory !== "All";

  return (
    <div className="mt-8 overflow-hidden rounded-3xl border border-dashed border-border/60 bg-surface/45 p-8 text-center shadow-[0_0_48px_rgba(139,92,246,0.08)] backdrop-blur-xl">
      <div className="mx-auto flex min-h-80 max-w-lg flex-col items-center justify-center">
        <div className="mb-6 grid size-24 place-items-center rounded-3xl border border-brand-soft/25 bg-brand-soft/10 shadow-[0_0_48px_rgba(139,92,246,0.14)]">
          <ImageIcon size={34} className="text-brand-soft" />
        </div>
        <p className="font-heading text-3xl font-semibold text-foreground">
          {isFiltered ? "No frames in this category" : "No frames here yet"}
        </p>
        <p className="mt-3 max-w-md text-sm leading-7 text-muted-foreground">
          {isFiltered
            ? `There are no gallery items tagged ${selectedCategory} yet. Try another category or reset the filter.`
            : "Gallery items from Cloudinary will appear here once they are added to the database."}
        </p>
      </div>
    </div>
  );
}
