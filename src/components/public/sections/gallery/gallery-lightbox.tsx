"use client";

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useReducedMotion } from "motion/react";
import { useCallback, useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import { useLightboxScrollLock } from "@/hooks/use-lightbox-scroll-lock";
import styles from "./gallery.module.css";
import type { GalleryPhoto } from "./types";

export function GalleryLightbox({
  open,
  photos,
  index,
  onIndexChange,
  onClose,
}: {
  open: boolean;
  photos: GalleryPhoto[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const reduce = useReducedMotion();
  const scrollLock = useLightboxScrollLock();
  const [detailsHeight, setDetailsHeight] = useState(112);
  const photo = photos[index];
  const hasDetails = Boolean(
    photo?.caption || photo?.description || photo?.category,
  );
  // Keep the actual image viewport separate from the scrollable description.
  const measureDetails = useCallback((node: HTMLElement | null) => {
    if (!node) return;
    const observer = new ResizeObserver(() => {
      setDetailsHeight(node.getBoundingClientRect().height);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Lightbox
      className={styles.lightbox}
      open={open}
      close={onClose}
      index={index}
      slides={photos.map((item) => ({
        src: item.src,
        alt: item.alt,
        width: item.width,
        height: item.height,
      }))}
      plugins={[Zoom]}
      zoom={{ scrollToZoom: false }}
      carousel={{
        finite: photos.length <= 1,
        imageFit: "contain",
        padding: 16,
        preload: 1,
      }}
      controller={{ closeOnBackdropClick: true }}
      animation={{
        fade: reduce ? 0 : 180,
        swipe: reduce ? 0 : 240,
        zoom: reduce ? 0 : 200,
      }}
      styles={{ container: { bottom: hasDetails ? detailsHeight : 0 } }}
      on={{
        ...scrollLock,
        view: ({ index: nextIndex }) => onIndexChange(nextIndex),
      }}
      render={{
        iconClose: () => <XIcon size={22} aria-hidden="true" />,
        iconPrev: () => <ArrowLeftIcon size={22} aria-hidden="true" />,
        iconNext: () => <ArrowRightIcon size={22} aria-hidden="true" />,
        iconZoomIn: () => (
          <MagnifyingGlassPlusIcon size={22} aria-hidden="true" />
        ),
        iconZoomOut: () => (
          <MagnifyingGlassMinusIcon size={22} aria-hidden="true" />
        ),
        controls: () => (
          <>
            <p
              className={styles.counter}
              role="status"
              aria-live="polite"
              aria-label={`Image ${index + 1} of ${photos.length}`}
            >
              {index + 1} <span aria-hidden="true">/</span> {photos.length}
            </p>
            {hasDetails && (
              <section
                ref={measureDetails}
                className={styles.details}
                data-gallery-details
                data-lenis-prevent
                // biome-ignore lint/a11y/noNoninteractiveTabindex: Bounded image details need a focus stop for keyboard scrolling inside the lightbox.
                tabIndex={0}
                aria-label="Image details"
                onPointerDown={(event) => event.stopPropagation()}
                onWheel={(event) => event.stopPropagation()}
              >
                <div className={styles.detailsInner}>
                  {photo.category && (
                    <p className={styles.detailsCategory}>{photo.category}</p>
                  )}
                  {photo.caption && <h2>{photo.caption}</h2>}
                  {photo.description && (
                    <p className={styles.description}>{photo.description}</p>
                  )}
                </div>
              </section>
            )}
          </>
        ),
      }}
    />
  );
}
