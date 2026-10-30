"use client";

import { TrashIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

/** An opaque, labelled action stays readable over both bright and dark photos. */
export function ImageRemoveButton({
  label,
  disabled,
  onRemove,
}: {
  label: string;
  disabled?: boolean;
  onRemove: () => void;
}) {
  return (
    <Button
      type="button"
      variant="secondary"
      className="top-2 right-2 z-10 absolute gap-2 bg-popover hover:bg-surface-hover shadow-md px-3 border-border h-11 min-h-11 text-foreground hover:text-destructive"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onRemove}
    >
      <TrashIcon className="size-4 text-destructive" weight="bold" />
      Remove
    </Button>
  );
}
