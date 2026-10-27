"use client";

// Trigger/search adapted for Storylio from BeUI's MIT multi-select; see LICENSE.
import {
  CaretUpDownIcon,
  MagnifyingGlassIcon,
  XIcon,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useMultiSelectContext } from "./context";
import { EASE_OUT } from "./motion";
import styles from "./multi-select.module.css";

export function MultiSelectTrigger({
  label,
  onClear,
}: {
  label: string;
  onClear?: () => void;
}) {
  const context = useMultiSelectContext("MultiSelectTrigger");
  const count = context.values.length;
  return (
    <div ref={context.triggerRef} className={styles.field}>
      <button
        id={context.triggerId}
        type="button"
        aria-label={label}
        aria-description={
          count ? context.values.join(", ") : "All technologies"
        }
        aria-haspopup="listbox"
        aria-expanded={context.open}
        aria-controls={context.open ? context.listId : undefined}
        disabled={context.disabled}
        className={styles.trigger}
        data-clearable={count > 0 || undefined}
        onClick={() => context.setOpen(!context.open)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            context.setOpen(true);
          }
        }}
      >
        <span className={styles.triggerLabel}>Stack</span>
        <span className={styles.desktopSummary}>
          {count === 0
            ? "All technologies"
            : context.values.slice(0, 2).join(" + ")}
          {count > 2 && ` +${count - 2}`}
        </span>
        <span className={styles.mobileSummary}>
          {count === 0
            ? "All technologies"
            : `${count} ${count === 1 ? "technology" : "technologies"}`}
        </span>
        {count === 0 && (
          <CaretUpDownIcon size={16} aria-hidden="true" className="shrink-0" />
        )}
      </button>
      {count > 0 && onClear && (
        <button
          type="button"
          className={styles.clear}
          aria-label="Reset stack"
          onClick={() => {
            context.setOpen(false, true);
            onClear();
            context.triggerRef.current
              ?.querySelector("button")
              ?.focus({ preventScroll: true });
          }}
        >
          <XIcon size={18} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export function MultiSelectSearch() {
  const context = useMultiSelectContext("MultiSelectSearch");
  return (
    <div className={styles.search}>
      <MagnifyingGlassIcon size={18} aria-hidden="true" />
      <input
        ref={context.inputRef}
        id={context.inputId}
        role="combobox"
        aria-label="Search technologies"
        aria-autocomplete="list"
        aria-expanded={context.open}
        aria-controls={context.listId}
        aria-activedescendant={context.open ? context.activeItemId : undefined}
        autoComplete="off"
        value={context.query}
        placeholder="Search technologies…"
        onChange={(event) => context.setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            context.moveActive(event.key === "ArrowDown" ? 1 : -1);
          } else if (event.key === "Enter") {
            event.preventDefault();
            context.toggleActive();
          } else if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            context.setOpen(false, true);
          }
        }}
      />
    </div>
  );
}

export function MultiSelectSelections() {
  const context = useMultiSelectContext("MultiSelectSelections");
  return (
    <div className={context.values.length ? styles.selections : undefined}>
      <AnimatePresence initial={false}>
        {context.values.map((value) => (
          <motion.button
            key={value}
            type="button"
            className={styles.selection}
            aria-label={`Remove ${context.labelFor(value)}`}
            initial={context.reduce ? false : { opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: context.reduce ? 1 : 0.94 }}
            transition={{ duration: context.reduce ? 0 : 0.14, ease: EASE_OUT }}
            onClick={() => {
              context.remove(value);
              context.inputRef.current?.focus({ preventScroll: true });
            }}
          >
            {context.labelFor(value)} <XIcon size={14} aria-hidden="true" />
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
