"use client";

import {
  GridFourIcon,
  ListBulletsIcon,
  SortAscendingIcon,
  SortDescendingIcon,
} from "@phosphor-icons/react";
import { useId } from "react";
import { MultiSelectContent } from "@/components/common/multi-select/content";
import { MultiSelect } from "@/components/common/multi-select/context";
import {
  MultiSelectEmpty,
  MultiSelectItem,
  MultiSelectList,
} from "@/components/common/multi-select/list";
import {
  MultiSelectSearch,
  MultiSelectSelections,
  MultiSelectTrigger,
} from "@/components/common/multi-select/trigger";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

type Choice<T extends string> = { value: T; label: string };

export function DashboardSort<T extends string>({
  value,
  options,
  onValueChange,
  direction,
  onDirectionChange,
  disabled,
  className,
}: {
  value: T;
  options: readonly Choice<T>[];
  onValueChange: (value: T) => void;
  direction: "asc" | "desc";
  onDirectionChange: (value: "asc" | "desc") => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-end gap-2 min-w-0", className)}>
      <div className="flex-1 min-w-0">
        <DashboardSelect
          label="Sort by"
          value={value}
          options={options}
          onValueChange={onValueChange}
          disabled={disabled}
          triggerClassName="min-h-11"
        />
      </div>
      <Button
        type="button"
        size="icon"
        variant="outline"
        className="bg-surface hover:bg-surface-hover dark:bg-surface dark:hover:bg-surface-hover p-0 border-input size-11 shrink-0"
        disabled={disabled}
        aria-label={direction === "asc" ? "Sort descending" : "Sort ascending"}
        title={
          direction === "asc"
            ? "Ascending order; switch to descending"
            : "Descending order; switch to ascending"
        }
        onClick={() => onDirectionChange(direction === "asc" ? "desc" : "asc")}
      >
        {direction === "asc" ? (
          <SortAscendingIcon aria-hidden />
        ) : (
          <SortDescendingIcon aria-hidden />
        )}
      </Button>
    </div>
  );
}

export function DashboardViewToggle({
  value,
  onValueChange,
}: {
  value: "list" | "grid";
  onValueChange: (value: "list" | "grid") => void;
}) {
  return (
    <ToggleGroup
      aria-label="Content view"
      value={[value]}
      variant="outline"
      spacing={1}
      onValueChange={([next]) => {
        if (next === "list" || next === "grid") onValueChange(next);
      }}
    >
      <ToggleGroupItem value="list" aria-label="List view">
        <ListBulletsIcon />
      </ToggleGroupItem>
      <ToggleGroupItem value="grid" aria-label="Grid view">
        <GridFourIcon />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

export function DashboardStatusFilter<T extends string>({
  label,
  value,
  options,
  onValueChange,
}: {
  label: string;
  value: T;
  options: readonly Choice<T>[];
  onValueChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <span className="text-muted-foreground text-xs">{label}</span>
      <ToggleGroup
        aria-label={label}
        value={[value]}
        variant="outline"
        spacing={1}
        className="flex-wrap"
        onValueChange={([next]) => {
          const choice = options.find((option) => option.value === next);
          if (choice) onValueChange(choice.value);
        }}
      >
        {options.map((option) => (
          <ToggleGroupItem key={option.value} value={option.value}>
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}

export function DashboardSelect<T extends string>({
  label,
  value,
  options,
  onValueChange,
  disabled,
  compact = false,
  id,
  triggerClassName,
}: {
  label: string;
  value: T;
  options: readonly Choice<T>[];
  onValueChange: (value: T) => void;
  disabled?: boolean;
  compact?: boolean;
  id?: string;
  triggerClassName?: string;
}) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <label htmlFor={controlId} className="text-muted-foreground text-xs">
        {label}
      </label>
      <Select
        items={options}
        value={value}
        disabled={disabled}
        onValueChange={(next) => {
          if (next !== null) onValueChange(next);
        }}
      >
        <SelectTrigger
          id={controlId}
          size={compact ? "sm" : "default"}
          className={`w-full ${triggerClassName ?? ""}`}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false} align="start">
          <SelectGroup>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}

export function DashboardMultiFilter({
  label,
  values,
  options,
  onValueChange,
  emptyLabel = "All",
  labelPlacement = "inside",
}: {
  label: string;
  values: string[];
  options: string[];
  onValueChange: (values: string[]) => void;
  emptyLabel?: string;
  labelPlacement?: "inside" | "above";
}) {
  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      {labelPlacement === "above" && (
        <span className="text-muted-foreground text-xs">{label}</span>
      )}
      <MultiSelect value={values} onValueChange={onValueChange}>
        <MultiSelectTrigger
          label={`Filter ${label.toLowerCase()}`}
          fieldLabel={labelPlacement === "above" ? "" : label}
          selectionNouns={label === "Tags" ? ["tag", "tags"] : undefined}
          emptyLabel={emptyLabel}
          clearLabel={`Reset ${label.toLowerCase()}`}
          onClear={() => onValueChange([])}
        />
        <MultiSelectContent>
          <MultiSelectSearch
            label={`Search ${label.toLowerCase()}`}
            placeholder={`Search ${label.toLowerCase()}…`}
          />
          <MultiSelectSelections />
          <MultiSelectList ariaLabel={label}>
            {options.map((option) => (
              <MultiSelectItem key={option} value={option}>
                {option}
              </MultiSelectItem>
            ))}
          </MultiSelectList>
          <MultiSelectEmpty>No matching options.</MultiSelectEmpty>
        </MultiSelectContent>
      </MultiSelect>
    </div>
  );
}
