"use client";

import { GridFourIcon, ListBulletsIcon } from "@phosphor-icons/react";
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type Choice<T extends string> = { value: T; label: string };

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
}: {
  label: string;
  value: T;
  options: readonly Choice<T>[];
  onValueChange: (value: T) => void;
  disabled?: boolean;
  compact?: boolean;
  id?: string;
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
          className="w-full"
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
}: {
  label: string;
  values: string[];
  options: string[];
  onValueChange: (values: string[]) => void;
  emptyLabel?: string;
}) {
  return (
    <MultiSelect value={values} onValueChange={onValueChange}>
      <MultiSelectTrigger
        label={`Filter ${label.toLowerCase()}`}
        fieldLabel={label}
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
  );
}
