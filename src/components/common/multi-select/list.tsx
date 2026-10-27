"use client";
// beui.dev/components/motion/multi-select

import { CheckIcon as Check } from "@phosphor-icons/react/dist/csr/Check";
import { motion } from "motion/react";
import {
  type ReactNode,
  useContext,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { cn } from "@/lib/utils";
import { MultiSelectGroupContext, useMultiSelectContext } from "./context";
import { EASE_OUT, SPRING_LAYOUT } from "./motion";

export interface MultiSelectListProps {
  children: ReactNode;
  ariaLabel?: string;
  className?: string;
}

export function MultiSelectList({
  children,
  ariaLabel = "Options",
  className,
}: MultiSelectListProps) {
  const context = useMultiSelectContext("MultiSelectList");
  return (
    <div
      id={context.listId}
      role="listbox"
      data-lenis-prevent
      aria-label={ariaLabel}
      aria-multiselectable={context.selectionMode === "multiple"}
      style={{
        maxHeight: "min(16rem, var(--multi-select-list-height, 16rem))",
      }}
      className={cn(
        "[&::-webkit-scrollbar]:hidden isolate relative p-1.5 max-h-64 [-ms-overflow-style:none] overflow-y-auto overscroll-contain scrollbar-none",
        className,
      )}
    >
      {children}
    </div>
  );
}

export interface MultiSelectGroupProps {
  children: ReactNode;
  className?: string;
}

export function MultiSelectGroup({
  children,
  className,
}: MultiSelectGroupProps) {
  const context = useMultiSelectContext("MultiSelectGroup");
  const groupId = useId();
  return (
    <MultiSelectGroupContext.Provider value={groupId}>
      <fieldset
        hidden={!context.hasVisibleItems(groupId)}
        className={cn("m-0 p-0 py-0.5 border-0 min-w-0", className)}
      >
        {children}
      </fieldset>
    </MultiSelectGroupContext.Provider>
  );
}

export interface MultiSelectLabelProps {
  children: ReactNode;
  className?: string;
}

export function MultiSelectLabel({
  children,
  className,
}: MultiSelectLabelProps) {
  const groupId = useContext(MultiSelectGroupContext);
  const labelClassName = cn(
    "px-2 py-1.5 w-full font-medium text-[0.68rem] text-muted-foreground uppercase tracking-[0.12em]",
    className,
  );
  return groupId ? (
    <legend className={labelClassName}>{children}</legend>
  ) : (
    <div className={labelClassName}>{children}</div>
  );
}

export interface MultiSelectItemProps {
  value: string;
  children: ReactNode;
  textValue?: string;
  keywords?: string[];
  disabled?: boolean;
  onSelect?: (value: string) => void;
  className?: string;
}

export function MultiSelectItem({
  value,
  children,
  textValue,
  keywords = [],
  disabled = false,
  onSelect,
  className,
}: MultiSelectItemProps) {
  const context = useMultiSelectContext("MultiSelectItem");
  const groupId = useContext(MultiSelectGroupContext);
  const id = useId();
  const itemRef = useRef<HTMLButtonElement>(null);
  const label = textValue ?? (typeof children === "string" ? children : value);
  const visible = context.isVisible(value);
  const active = context.activeValue === value;
  const selected = context.values.includes(value);
  const keywordKey = keywords.join("\u0000");
  const normalizedKeywords = useMemo(
    () => (keywordKey ? keywordKey.split("\u0000") : []),
    [keywordKey],
  );
  const { registerItem, unregisterItem } = context;

  useLayoutEffect(() => {
    registerItem({
      value,
      label,
      keywords: normalizedKeywords,
      disabled,
      groupId,
      id,
      ref: itemRef,
    });
    return () => unregisterItem(value);
  }, [
    disabled,
    groupId,
    id,
    label,
    normalizedKeywords,
    registerItem,
    unregisterItem,
    value,
  ]);

  if (!visible) return null;

  return (
    <button
      ref={itemRef}
      id={id}
      type="button"
      role="option"
      aria-selected={selected}
      disabled={disabled}
      tabIndex={-1}
      data-multi-select-item=""
      data-active={active || undefined}
      data-selected={selected || undefined}
      onPointerMove={() => {
        if (!disabled) context.setActiveValue(value);
      }}
      onPointerDown={(event) => event.preventDefault()}
      onClick={() => {
        if (disabled) return;
        onSelect?.(value);
        context.toggle(value);
      }}
      className={cn(
        "relative flex items-center gap-2 px-3 py-2 rounded-lg outline-none w-full min-h-11 text-sm text-left transition-colors duration-150",
        active || selected ? "text-foreground" : "text-muted-foreground",
        "disabled:pointer-events-none disabled:opacity-45",
        className,
      )}
    >
      {active ? (
        <motion.span
          aria-hidden="true"
          layoutId={context.activeLayoutId}
          className="-z-10 absolute inset-0 bg-muted rounded-lg"
          transition={context.reduce ? { duration: 0 } : SPRING_LAYOUT}
        />
      ) : null}
      <span className="flex-1 min-w-0">{children}</span>
      <motion.span
        aria-hidden="true"
        initial={false}
        animate={{
          opacity: selected ? 1 : 0,
          transform: selected ? "scale(1)" : "scale(0.82)",
        }}
        transition={
          context.reduce ? { duration: 0 } : { duration: 0.14, ease: EASE_OUT }
        }
        className="place-items-center grid size-5 text-foreground shrink-0"
      >
        <Check className="size-4" />
      </motion.span>
    </button>
  );
}

export interface MultiSelectEmptyProps {
  children?: ReactNode;
  className?: string;
}

export function MultiSelectEmpty({
  children = "No options found.",
  className,
}: MultiSelectEmptyProps) {
  const context = useMultiSelectContext("MultiSelectEmpty");
  if (context.visibleCount > 0) return null;
  return (
    <div
      role="status"
      className={cn(
        "px-3 py-8 text-muted-foreground text-sm text-center",
        className,
      )}
    >
      {children}
    </div>
  );
}

export interface MultiSelectSeparatorProps {
  className?: string;
}

export function MultiSelectSeparator({ className }: MultiSelectSeparatorProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("-mx-1 my-1 bg-border h-px", className)}
    />
  );
}
