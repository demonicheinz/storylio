"use client";

import { ImageIcon, ImagesIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { MasonryPhotoAlbum } from "react-photo-album";
import Lightbox from "yet-another-react-lightbox";
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
      <div className="bg-background/65 sm:bg-surface/55 backdrop-blur-xl -mx-4 sm:mx-0 px-4 sm:px-5 py-3.5 sm:border border-border/30 border-y sm:rounded-3xl">
        <div className="flex items-center gap-2 mb-2.5 font-semibold text-muted-foreground text-xs uppercase tracking-[0.24em]">
          <ImagesIcon className="text-brand-soft" size={16} />
          Filter by category
        </div>

        <div className="[&::-webkit-scrollbar]:hidden flex gap-2 pb-1 overflow-x-auto scrollbar-none">
          {["All", ...categories].map((category) => {
            const isSelected = category === activeCategory;

            return (
              <Button
                key={category}
                type="button"
                variant={isSelected ? "default" : "outline"}
                size="sm"
                className="rounded-full shrink-0"
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

      <div className="flex flex-wrap justify-between items-center gap-3 mt-4 px-1 text-muted-foreground text-sm">
        <p>{formatGallerySummary(filteredPhotos.length, activeCategory)}</p>
        {activeCategory !== "All" && (
          <button
            type="button"
            className="text-brand-soft hover:text-foreground hover:underline underline-offset-4 transition-colors"
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
                <div className="bg-background/75 shadow-[0_0_48px_rgba(139,92,246,0.14)] backdrop-blur-xl px-4 sm:px-5 py-3 border border-border/40 rounded-2xl max-w-[calc(100vw-2rem)] sm:max-w-2xl">
                  {activePhoto.category && (
                    <Badge className="bg-brand-soft/90 mb-2 rounded-full text-primary-foreground">
                      {activePhoto.category}
                    </Badge>
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
      className="group/photo block relative bg-surface/65 shadow-[0_0_48px_rgba(139,92,246,0.08)] hover:shadow-[0_0_64px_rgba(139,92,246,0.14)] border border-border/40 hover:border-brand-soft/45 rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-brand-soft/60 overflow-hidden transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 duration-300"
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
          className="object-cover group-hover/photo:scale-105 transition-transform duration-500"
          placeholder={photo.blurDataUrl ? "blur" : "empty"}
          blurDataURL={photo.blurDataUrl ?? undefined}
          onError={() => setHasImageError(true)}
        />
      )}
      <div className="absolute inset-0 bg-linear-to-t from-background/85 via-background/8 to-transparent opacity-80 group-hover/photo:opacity-95 transition-opacity duration-300 pointer-events-none" />
      <div className="bottom-0 absolute inset-x-0 flex flex-col gap-3 p-4 text-left">
        {photo.category && (
          <Badge className="bg-brand-soft/90 rounded-full w-fit text-primary-foreground">
            {photo.category}
          </Badge>
        )}
        {photo.caption && (
          <p className="max-w-sm font-medium text-foreground text-sm leading-6">
            {photo.caption}
          </p>
        )}
        {photo.description && (
          <p className="max-w-sm text-muted-foreground text-xs line-clamp-2 leading-5">
            {photo.description}
          </p>
        )}
      </div>
    </button>
  );
}

function GalleryImageFallback({ caption }: { caption: string | null }) {
  return (
    <div className="absolute inset-0 flex flex-col justify-center items-center gap-4 bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.26),transparent_36%),linear-gradient(135deg,rgba(14,12,26,0.96),rgba(31,26,54,0.78),rgba(10,10,20,0.98))] p-6 text-center">
      <div className="flex justify-center items-center bg-brand-soft/10 shadow-[0_0_36px_rgba(139,92,246,0.18)] border border-brand-soft/30 rounded-2xl size-14 text-brand-soft">
        <ImageIcon size={24} />
      </div>
      <p className="max-w-48 text-muted-foreground text-sm leading-6">
        {caption ?? "This image could not be loaded."}
      </p>
    </div>
  );
}

function GalleryEmptyState({ selectedCategory }: { selectedCategory: string }) {
  const isFiltered = selectedCategory !== "All";

  return (
    <div className="bg-surface/45 shadow-[0_0_48px_rgba(139,92,246,0.08)] backdrop-blur-xl mt-8 p-8 border border-border/60 border-dashed rounded-3xl overflow-hidden text-center">
      <div className="flex flex-col justify-center items-center mx-auto max-w-lg min-h-80">
        <div className="place-items-center grid bg-brand-soft/10 shadow-[0_0_48px_rgba(139,92,246,0.14)] mb-6 border border-brand-soft/25 rounded-3xl size-24">
          <ImageIcon size={34} className="text-brand-soft" />
        </div>
        <p className="font-heading font-semibold text-foreground text-3xl">
          {isFiltered ? "No frames in this category" : "No frames here yet"}
        </p>
        <p className="mt-3 max-w-md text-muted-foreground text-sm leading-7">
          {isFiltered
            ? `There are no gallery items tagged ${selectedCategory} yet. Try another category or reset the filter.`
            : "Gallery items from Cloudinary will appear here once they are added to the database."}
        </p>
      </div>
    </div>
  );
}
