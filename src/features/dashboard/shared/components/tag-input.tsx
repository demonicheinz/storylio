"use client";

import { TagIcon, XIcon } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
        "flex flex-wrap items-center gap-1.5 bg-surface px-2 py-1 border border-input rounded-md min-w-0 min-h-9 transition-[border-color,box-shadow]",
        "focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/40",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      {tags.map((tag) => (
        <Badge
          key={tag}
          variant="secondary"
          className="gap-1 py-0 pr-0 border-0 rounded-md max-w-full h-11"
        >
          <TagIcon className="size-3 shrink-0" />
          <span className="truncate">{tag}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11 shrink-0"
            disabled={disabled}
            onClick={() => removeTag(tag)}
            aria-label={`Remove ${tag}`}
          >
            <XIcon />
          </Button>
        </Badge>
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
