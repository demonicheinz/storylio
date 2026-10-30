"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { XIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { type ReactNode, useRef, useState } from "react";
import { NoteReadingBody } from "@/components/public/notes/note-reading-body";
import styles from "@/components/public/notes/notes.module.css";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";

export function NotePreview({
  id,
  title,
  dateISO,
  dateLabel,
  state,
  body,
}: {
  id: string;
  title: string;
  dateISO: string;
  dateLabel: string;
  state: string;
  body: ReactNode;
}) {
  const [open, setOpen] = useState(true);
  const heading = useRef<HTMLHeadingElement>(null);
  return (
    <main className="bg-background p-4 pt-24 min-h-screen">
      <div className="flex flex-wrap justify-between items-center gap-3 mx-auto max-w-3xl">
        <Button
          render={<Link href={`/dashboard/posts/${id}/edit`} />}
          nativeButton={false}
          variant="outline"
        >
          Back to editor
        </Button>
        <Button type="button" variant="outline" onClick={() => setOpen(true)}>
          Open saved Note preview
        </Button>
        <p className="w-full text-muted-foreground text-sm">
          Private preview · {state} · Saved version. No view tracking or public
          sharing.
        </p>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogPortal>
          <DialogOverlay />
          <DialogPrimitive.Popup
            className={styles.popup}
            initialFocus={() => heading.current}
          >
            <div className={styles.header}>
              <DialogTitle ref={heading} tabIndex={-1} className={styles.title}>
                {title}
              </DialogTitle>
              <DialogClose
                render={
                  <button
                    type="button"
                    className={styles.close}
                    aria-label="Close note preview"
                  />
                }
              >
                <XIcon className="size-5" aria-hidden />
              </DialogClose>
            </div>
            <div className={styles.meta}>
              <time dateTime={dateISO}>{dateLabel}</time>
              <span>{state} · Private preview</span>
            </div>
            <NoteReadingBody>{body}</NoteReadingBody>
          </DialogPrimitive.Popup>
        </DialogPortal>
      </Dialog>
    </main>
  );
}
