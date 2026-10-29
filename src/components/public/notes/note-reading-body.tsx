"use client";
import type { ReactNode } from "react";
import reading from "@/components/public/reading.module.css";
import styles from "./notes.module.css";

/** Shared scroll/anchor behavior for public Notes and authenticated previews. */
export function NoteReadingBody({ children }: { children: ReactNode }) {
  return (
    <div
      className={`${reading.prose} ${styles.body}`}
      data-lenis-prevent
      data-note-body
      onClickCapture={(event) => {
        if (
          event.button ||
          event.altKey ||
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey
        )
          return;
        const link =
          event.target instanceof Element ? event.target.closest("a") : null;
        const href = link?.getAttribute("href");
        if (!href?.startsWith("#")) return;
        let id: string;
        try {
          id = decodeURIComponent(href.slice(1));
        } catch {
          return;
        }
        const target = event.currentTarget.querySelector<HTMLElement>(
          `#${CSS.escape(id)}`,
        );
        if (!target) return;
        event.preventDefault();
        event.stopPropagation();
        const body = event.currentTarget;
        body.scrollTo({
          top:
            body.scrollTop +
            target.getBoundingClientRect().top -
            body.getBoundingClientRect().top -
            16,
          behavior: "auto",
        });
        if (!target.hasAttribute("tabindex")) {
          target.setAttribute("tabindex", "-1");
          target.addEventListener(
            "blur",
            () => target.removeAttribute("tabindex"),
            { once: true },
          );
        }
        target.focus({ preventScroll: true });
      }}
    >
      {children}
    </div>
  );
}
