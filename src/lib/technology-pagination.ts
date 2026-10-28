export function getTechnologyPage<T>(
  items: T[],
  capacity: number,
  page: number,
) {
  const size = Math.max(1, Math.floor(capacity));
  const pages = Math.max(1, Math.ceil(items.length / size));
  const current = ((page % pages) + pages) % pages;
  // Keep the final view filled; adjacent views can share items at the end.
  const start = Math.min(current * size, Math.max(0, items.length - size));
  return {
    items: items.slice(start, start + size),
    page: current,
    pages,
  };
}
