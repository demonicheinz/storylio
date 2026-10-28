"use client";

import { MultiSelectContent } from "@/components/common/multi-select/content";
import { MultiSelect } from "@/components/common/multi-select/context";
import {
  MultiSelectEmpty,
  MultiSelectItem,
  MultiSelectList,
} from "@/components/common/multi-select/list";
import {
  MultiSelectSearch,
  MultiSelectTrigger,
} from "@/components/common/multi-select/trigger";
import styles from "./gallery.module.css";

export function GalleryFilters({
  categories,
  selectedCategory,
  resultCount,
  totalItems,
  pending,
  onChange,
}: {
  categories: string[];
  selectedCategory?: string;
  resultCount: number;
  totalItems: number;
  pending: boolean;
  onChange: (category?: string) => void;
}) {
  return (
    <div className={styles.toolbar}>
      <p
        className={styles.result}
        role="status"
        aria-live="polite"
        aria-busy={pending}
      >
        {pending
          ? "Updating…"
          : `${resultCount}${selectedCategory ? ` of ${totalItems}` : ""} ${resultCount === 1 ? "frame" : "frames"}`}
      </p>
      <div className={styles.filter}>
        <MultiSelect
          selectionMode="single"
          value={selectedCategory ? [selectedCategory] : []}
          onValueChange={(values) => onChange(values[0])}
        >
          <MultiSelectTrigger
            label="Filter category"
            fieldLabel="Category"
            emptyLabel="All categories"
            clearLabel="Reset category"
            onClear={() => onChange()}
          />
          <MultiSelectContent>
            <MultiSelectSearch
              label="Search categories"
              placeholder="Search categories…"
            />
            <MultiSelectList ariaLabel="Categories">
              {[
                ...new Set([
                  ...categories,
                  ...(selectedCategory ? [selectedCategory] : []),
                ]),
              ]
                .sort((a, b) => a.localeCompare(b))
                .map((category) => (
                  <MultiSelectItem key={category} value={category}>
                    {category}
                  </MultiSelectItem>
                ))}
            </MultiSelectList>
            <MultiSelectEmpty>No categories found.</MultiSelectEmpty>
          </MultiSelectContent>
        </MultiSelect>
      </div>
    </div>
  );
}
