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
        "flex flex-wrap items-center gap-1.5 bg-input/50 px-2 py-1 border border-transparent rounded-3xl min-w-0 min-h-9 transition-[color,box-shadow,background-color]",
        "focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 bg-secondary px-2 py-0.5 rounded-full max-w-36 font-medium text-[11px] text-secondary-foreground truncate"
        >
          <TagIcon className="size-3 shrink-0" />
          <span className="truncate">{tag}</span>
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="opacity-50 hover:opacity-100 ml-0.5 p-0.5 rounded-full transition-opacity shrink-0"
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
        className="flex-1 bg-transparent px-1 py-1 outline-none min-w-0 placeholder:text-muted-foreground text-sm basis-32"
      />
    </div>
  );
}
