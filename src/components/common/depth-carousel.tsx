"use client";

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ImageIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import {
  type CSSProperties,
  type PointerEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { IMAGE_QUALITY } from "@/lib/image-policy";
import styles from "./depth-carousel.module.css";

export type DepthCarouselImage = {
  src: string;
  alt: string;
  width?: number | null;
  height?: number | null;
  blurDataUrl?: string | null;
};

type DepthCarouselProps = {
  items: DepthCarouselImage[];
  index: number;
  onIndexChange: (index: number) => void;
  onSelect: (index: number) => void;
};

// Adapted from .docs/referensi/depth-carousel.tsx.bak: keep the active frame
// flat, bound the rear stack, and preserve normal vertical page gestures.
export function DepthCarousel({
  items,
  index,
  onIndexChange,
  onSelect,
}: DepthCarouselProps) {
  const stageId = useId();
  const drag = useRef<{
    x: number;
    y: number;
    id: number;
    moved: boolean;
  } | null>(null);
  const suppressClick = useRef(false);
  const current = Math.max(0, Math.min(index, items.length - 1));
  if (!items.length) return null;
  const active = items[current];
  const select = (next: number) =>
    onIndexChange((next + items.length) % items.length);

  const finishDrag = (event: PointerEvent<HTMLElement>, cancelled = false) => {
    const gesture = drag.current;
    drag.current = null;
    event.currentTarget.style.removeProperty("--drag-x");
    delete event.currentTarget.dataset.dragging;
    if (!gesture || gesture.id !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(gesture.id))
      event.currentTarget.releasePointerCapture(gesture.id);
    if (!gesture.moved) {
      // Activate a touch tap here so a prior swipe cannot swallow its click.
      // The following compatibility click is suppressed; keyboard clicks remain native.
      if (!cancelled && event.pointerType === "touch") {
        suppressClick.current = true;
        onSelect(current);
      }
      return;
    }
    suppressClick.current = true;
    const distance = event.clientX - gesture.x;
    if (!cancelled && Math.abs(distance) >= 40)
      select(current + (distance < 0 ? 1 : -1));
  };

  return (
    <section
      className={styles.carousel}
      aria-roledescription="carousel"
      aria-label="Project screenshots"
      onKeyDown={(event) => {
        if (items.length < 2) return;
        if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
          return;
        const next =
          event.key === "ArrowRight"
            ? current + 1
            : event.key === "ArrowLeft"
              ? current - 1
              : event.key === "Home"
                ? 0
                : event.key === "End"
                  ? items.length - 1
                  : null;
        if (next === null) return;
        event.preventDefault();
        select(next);
      }}
    >
      <div
        id={stageId}
        className={styles.stage}
        data-depth-carousel
        data-current-index={current}
        data-single={items.length === 1 || undefined}
        onPointerDown={(event) => {
          if (event.button !== 0 || !event.isPrimary || items.length < 2)
            return;
          suppressClick.current = false;
          drag.current = {
            x: event.clientX,
            y: event.clientY,
            id: event.pointerId,
            moved: false,
          };
        }}
        onPointerMove={(event) => {
          const gesture = drag.current;
          if (!gesture || gesture.id !== event.pointerId) return;
          const dx = event.clientX - gesture.x;
          const dy = event.clientY - gesture.y;
          if (!gesture.moved) {
            if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
              drag.current = null;
              return;
            }
            if (Math.abs(dx) < 10 || Math.abs(dx) <= Math.abs(dy) * 1.2) return;
            gesture.moved = true;
            // Touch already captures its initial target; keep that native path.
            if (event.pointerType === "mouse") {
              event.currentTarget.setPointerCapture(gesture.id);
            }
            event.currentTarget.dataset.dragging = "true";
          }
          event.currentTarget.style.setProperty(
            "--drag-x",
            `${Math.max(-24, Math.min(24, dx / 4))}px`,
          );
        }}
        onPointerUp={(event) => finishDrag(event)}
        onPointerCancel={(event) => finishDrag(event, true)}
        onClickCapture={(event) => {
          if (suppressClick.current && event.detail !== 0) {
            event.preventDefault();
            event.stopPropagation();
            suppressClick.current = false;
          }
        }}
      >
        {items.map((item, itemIndex) => {
          const depth = (itemIndex - current + items.length) % items.length;
          return (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: Duplicate screenshot URLs are allowed and deck positions are their local identity.
              key={`${item.src}-${itemIndex}`}
              className={styles.card}
              data-depth={depth}
              aria-hidden="true"
              style={
                {
                  "--depth": Math.min(depth, 3),
                  "--layer-opacity": depth < 3 ? 1 : 0,
                  "--layer-brightness": Math.max(0.65, 1 - depth * 0.12),
                  zIndex: 3 - Math.min(depth, 3),
                } as CSSProperties
              }
            >
              {depth < 3 && <CarouselImage item={item} />}
            </div>
          );
        })}
        <button
          type="button"
          className={styles.open}
          aria-label={`Open ${active.alt}`}
          onClick={() => onSelect(current)}
        />
      </div>
      {items.length > 1 && (
        <div className={styles.controls}>
          <div className={styles.navigation}>
            <button
              type="button"
              aria-label="Previous screenshot"
              aria-controls={stageId}
              onClick={() => select(current - 1)}
            >
              <ArrowLeftIcon size={18} aria-hidden="true" />
            </button>
            <p
              className={styles.counter}
              role="status"
              aria-live="polite"
              aria-atomic="true"
              aria-label={`Screenshot ${current + 1} of ${items.length}`}
            >
              {current + 1} / {items.length}
            </p>
            <button
              type="button"
              aria-label="Next screenshot"
              aria-controls={stageId}
              onClick={() => select(current + 1)}
            >
              <ArrowRightIcon size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function CarouselImage({ item }: { item: DepthCarouselImage }) {
  const [failed, setFailed] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const image = imageRef.current;
    if (!image) return;
    const updateCorners = () => {
      if (!image.naturalWidth || !image.naturalHeight) return;
      const scale = Math.min(
        image.clientWidth / image.naturalWidth,
        image.clientHeight / image.naturalHeight,
      );
      // Round the contained picture, excluding transparent letterbox space.
      image.style.setProperty(
        "--image-inset-x",
        `${Math.max(0, (image.clientWidth - image.naturalWidth * scale) / 2)}px`,
      );
      image.style.setProperty(
        "--image-inset-y",
        `${Math.max(0, (image.clientHeight - image.naturalHeight * scale) / 2)}px`,
      );
    };
    const observer = new ResizeObserver(updateCorners);
    observer.observe(image);
    image.addEventListener("load", updateCorners);
    updateCorners();
    return () => {
      observer.disconnect();
      image.removeEventListener("load", updateCorners);
    };
  }, []);
  if (failed)
    return (
      <div className={styles.fallback}>
        <ImageIcon size={24} />
        Preview unavailable. Open full size.
      </div>
    );
  return (
    <Image
      ref={imageRef}
      src={item.src}
      alt=""
      width={item.width || 1600}
      height={item.height || 900}
      draggable={false}
      quality={IMAGE_QUALITY.detail}
      sizes="(min-width:1120px) 968px, (min-width:768px) calc(100vw - 120px), calc(100vw - 60px)"
      onError={() => setFailed(true)}
      {...(item.blurDataUrl
        ? { placeholder: "blur" as const, blurDataURL: item.blurDataUrl }
        : {})}
    />
  );
}
