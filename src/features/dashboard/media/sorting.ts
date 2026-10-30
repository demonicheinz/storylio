export type MediaSortField = "date" | "size" | "name" | "format";
export type MediaSortDirection = "asc" | "desc";
type SortableMedia = {
  filename: string;
  format: string;
  size: number;
  createdAt: Date | string;
};

export function sortMediaItems<T extends SortableMedia>(
  items: readonly T[],
  field: MediaSortField,
  direction: MediaSortDirection,
): T[] {
  const sign = direction === "asc" ? 1 : -1;
  return [...items].sort((a, b) => {
    const comparison =
      field === "date"
        ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        : field === "size"
          ? a.size - b.size
          : field === "format"
            ? a.format.toLowerCase().localeCompare(b.format.toLowerCase())
            : a.filename.localeCompare(b.filename);
    return comparison * sign || a.filename.localeCompare(b.filename);
  });
}
