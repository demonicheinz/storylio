-- Project content enhancements.
ALTER TABLE "Project" ADD COLUMN "thumbnailImageUrl" TEXT;
ALTER TABLE "Project" ADD COLUMN "isFeatured" BOOLEAN NOT NULL DEFAULT false;

-- Gallery metadata and visibility enhancements.
ALTER TABLE "GalleryItem" ADD COLUMN "description" TEXT;
ALTER TABLE "GalleryItem" ADD COLUMN "altText" TEXT;
ALTER TABLE "GalleryItem" ADD COLUMN "width" INTEGER;
ALTER TABLE "GalleryItem" ADD COLUMN "height" INTEGER;
ALTER TABLE "GalleryItem" ADD COLUMN "aspectRatio" DOUBLE PRECISION;
ALTER TABLE "GalleryItem" ADD COLUMN "blurDataUrl" TEXT;
ALTER TABLE "GalleryItem" ADD COLUMN "isVisible" BOOLEAN NOT NULL DEFAULT true;
