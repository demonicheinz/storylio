"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { LinkSimpleIcon, XIcon } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import { useSearchParams } from "next/navigation";
import {
  type MouseEvent,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { ViewCounter } from "@/components/public/sections/blog/view-counter";
import {
  Dialog,
  DialogClose,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { buildNoteHref, buildNotePermalink } from "@/lib/note-links";
import { lockPageScroll } from "@/lib/page-scroll";
import { NoteReadingBody } from "./note-reading-body";
import styles from "./notes.module.css";

export type NoteView = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  dateISO: string;
  dateLabel: string;
  body: ReactNode;
};

export function ExpandableNotes({
  notes,
  selectedNote,
  home = false,
}: {
  notes: NoteView[];
  selectedNote: NoteView | null;
  home?: boolean;
}) {
  const search = useSearchParams();
  const slug = search.get("note");
  const open = Boolean(slug);
  const resolved =
    notes.find((note) => note.slug === slug) ??
    (selectedNote?.slug === slug ? selectedNote : null);
  const lastNote = useRef<NoteView | null>(null);
  if (resolved) lastNote.current = resolved;
  const active = open ? resolved : lastNote.current;
  const trigger = useRef<HTMLElement | null>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const release = useRef<(() => void) | null>(null);
  const scope = useId();
  const reduce = useReducedMotion();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) release.current ??= lockPageScroll();
    setCopied(false);
  }, [open]);
  useEffect(
    () => () => {
      release.current?.();
      release.current = null;
    },
    [],
  );

  const openNote = (event: MouseEvent<HTMLAnchorElement>, note: NoteView) => {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.altKey ||
      event.shiftKey
    )
      return;
    event.preventDefault();
    trigger.current = event.currentTarget;
    release.current ??= lockPageScroll();
    window.history.pushState(
      { storylioNote: note.slug },
      "",
      buildNoteHref(
        location.pathname,
        location.search,
        note.slug,
        location.hash,
      ),
    );
  };
  const close = () => {
    if (window.history.state?.storylioNote === slug) window.history.back();
    else
      window.history.replaceState(
        null,
        "",
        buildNoteHref(
          location.pathname,
          location.search,
          undefined,
          location.hash,
        ),
      );
  };
  const copyLink = async () => {
    if (!active) return;
    try {
      await navigator.clipboard.writeText(
        new URL(buildNotePermalink(active.slug), location.origin).href,
      );
      setCopied(true);
    } catch {
      toast.add({ title: "Could not copy note link.", type: "error" });
    }
  };

  return (
    <>
      <div
        className={styles.grid}
        data-note-grid
        data-home-grid={home ? "notes" : undefined}
      >
        {notes.map((note) => (
          <motion.a
            key={note.id}
            href={buildNotePermalink(note.slug)}
            className={styles.card}
            data-note-card
            data-note-slug={note.slug}
            layoutId={reduce ? undefined : `note-${scope}-${note.id}`}
            transition={{
              duration: reduce ? 0 : 0.28,
              ease: [0.16, 1, 0.3, 1],
            }}
            onClick={(event) => openNote(event, note)}
          >
            <h3>{note.title}</h3>
            {note.excerpt && <p className={styles.excerpt}>{note.excerpt}</p>}
            <time dateTime={note.dateISO}>{note.dateLabel}</time>
          </motion.a>
        ))}
      </div>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) close();
        }}
        onOpenChangeComplete={(next) => {
          if (!next) {
            release.current?.();
            release.current = null;
          }
        }}
      >
        <DialogPortal>
          <DialogOverlay />
          <DialogPrimitive.Popup
            className={styles.popup}
            initialFocus={() => title.current}
            finalFocus={() =>
              trigger.current?.isConnected
                ? trigger.current
                : document.getElementById(home ? "notes" : "writing-list")
            }
            render={
              <motion.div
                layoutId={
                  !reduce && active ? `note-${scope}-${active.id}` : undefined
                }
                transition={{
                  duration: reduce ? 0 : 0.28,
                  ease: [0.16, 1, 0.3, 1],
                }}
              />
            }
          >
            <div className={styles.header}>
              <DialogTitle ref={title} tabIndex={-1} className={styles.title}>
                {active?.title ?? "Note unavailable"}
              </DialogTitle>
              <DialogClose
                render={
                  <button
                    type="button"
                    className={styles.close}
                    aria-label="Close note"
                  />
                }
              >
                <XIcon size={20} aria-hidden="true" />
              </DialogClose>
            </div>
            {active && (
              <div className={styles.meta}>
                <time dateTime={active.dateISO}>{active.dateLabel}</time>
                <button
                  type="button"
                  className={styles.copy}
                  onClick={copyLink}
                >
                  <LinkSimpleIcon size={16} aria-hidden="true" />
                  {copied ? "Copied" : "Copy link"}
                </button>
              </div>
            )}
            <NoteReadingBody>
              {active ? (
                <>
                  {active.body}
                  <ViewCounter slug={active.slug} />
                </>
              ) : (
                <p>This note may have been removed or is not published.</p>
              )}
            </NoteReadingBody>
          </DialogPrimitive.Popup>
        </DialogPortal>
      </Dialog>
    </>
  );
}
