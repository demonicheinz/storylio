"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { VenomScene } from "@/components/effects/venom/engine";
import { cn } from "@/lib/utils";
import { scrollToAnchor } from "./in-page-link";
import styles from "./venom-button.module.css";

type VenomButtonProps = {
  href: string;
  children: string;
  className?: string;
};

/** A real navigation link enhanced by the upstream Venom material and physics. */
export function VenomButton({ href, children, className }: VenomButtonProps) {
  const linkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const link = linkRef.current;
    if (!link) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = matchMedia("(hover: hover) and (pointer: fine)");
    let disposed = false;
    const bounds = link.getBoundingClientRect();
    let visible =
      bounds.bottom > 0 &&
      bounds.right > 0 &&
      bounds.top < innerHeight &&
      bounds.left < innerWidth;
    let generation = 0;
    let active = false;
    let focused = true;
    let scene: VenomScene | null = null;
    let cleanup: (() => void) | undefined;

    const stop = () => {
      generation++;
      active = false;
      cleanup?.();
      cleanup = undefined;
      scene = null;
    };

    const sync = async () => {
      const paused = !visible || document.hidden || !focused;
      link.dataset.venomPaused = String(paused);
      if (disposed || motion.matches || !pointer.matches) {
        stop();
        return;
      }
      if (paused) {
        if (scene) scene.pause({ keepVisible: visible });
        else stop();
        return;
      }
      if (scene) {
        scene.resume();
        return;
      }
      if (active) return;
      active = true;
      const ticket = ++generation;
      try {
        const font = getComputedStyle(link);
        const [renderer] = await Promise.all([
          import("@/components/effects/venom/engine").then(async (renderer) => {
            await renderer.prepareVenomAssets();
            return renderer;
          }),
          document.fonts.load(
            `${font.fontWeight} ${font.fontSize} ${font.fontFamily}`,
            children,
          ),
        ]);
        if (disposed || ticket !== generation) return;
        const canvas = document.createElement("canvas");
        canvas.className = styles.canvas;
        canvas.setAttribute("aria-hidden", "true");
        canvas.dataset.venomCanvas = "true";
        // Share the navbar's stacking context; a body portal would escape it.
        (link.closest("[data-public-chrome]") ?? document.body).append(canvas);
        scene = renderer.createVenomScene(canvas, link);
        if (!scene) {
          canvas.remove();
          active = false;
          return;
        }
        const mountedScene = scene;
        cleanup = () => {
          mountedScene.dispose();
          canvas.remove();
        };
      } catch {
        // The server-rendered link is the fallback for unavailable GPU/font/chunks.
        if (ticket === generation) stop();
      }
    };

    const onBlur = () => {
      focused = false;
      void sync();
    };
    const onFocus = () => {
      focused = true;
      void sync();
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      void sync();
    });
    observer.observe(link);
    motion.addEventListener("change", sync);
    pointer.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    // An above-the-fold CTA can prepare immediately, before the observer's callback.
    void sync();
    return () => {
      disposed = true;
      stop();
      observer.disconnect();
      motion.removeEventListener("change", sync);
      pointer.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      delete link.dataset.venomPaused;
    };
  }, [children]);

  const shared = {
    ref: linkRef,
    "data-venom-link": "true",
    className: cn(styles.link, className),
  };
  return href.startsWith("#") ? (
    <a
      {...shared}
      href={href}
      onClick={(event) => scrollToAnchor(event, href as `#${string}`)}
    >
      {children}
    </a>
  ) : (
    <Link {...shared} href={href}>
      {children}
    </Link>
  );
}
