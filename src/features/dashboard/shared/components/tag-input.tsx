"use client";

import { TagIcon, XIcon } from "@phosphor-icons/react";
import { useTagInput } from "@/hooks/use-tag-input";
import { cn } from "@/lib/utils";

type TagsInputProps = {
  value: string[]; // array tag dari RHF
  onChange: (tags: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  max?: number;
  id?: string;
};

export function TagsInput({
  value,
  onChange,
  disabled,
  placeholder,
  max = 10,
  id,
}: TagsInputProps) {
  const {
    tags,
    inputValue,
    handleBlur,
    handleInputChange,
    handleKeyDown,
    removeTag,
  } = useTagInput(value, { max, onChange });

  return (
    <div
      className={cn(
        "flex min-h-9 min-w-0 flex-wrap items-center gap-1.5 rounded-3xl border border-transparent bg-input/50 px-2 py-1 transition-[color,box-shadow,background-color]",
        "focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex max-w-36 items-center gap-1 truncate rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground"
        >
          <TagIcon className="size-3 shrink-0" />
          <span className="truncate">{tag}</span>
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="ml-0.5 shrink-0 rounded-full p-0.5 opacity-50 transition-opacity hover:opacity-100"
            aria-label={`Remove ${tag}`}
          >
            <XIcon className="size-2.5" />
          </button>
        </span>
      ))}
      <input
        id={id}
        value={inputValue}
        onChange={(e) => handleInputChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={
          tags.length > 0 ? "Add tag..." : (placeholder ?? "nextjs, ui, craft")
        }
        disabled={disabled}
        className="min-w-0 flex-1 basis-32 bg-transparent px-1 py-1 text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}
