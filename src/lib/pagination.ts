export type PaginationViewMode = "list" | "grid";

export const DASHBOARD_ITEMS_PER_PAGE = {
  list: 10,
  grid: 12,
} as const satisfies Record<PaginationViewMode, number>;

export const DASHBOARD_ITEMS_PER_PAGE_OPTIONS = {
  list: [10, 20, 40],
  grid: [12, 24, 48],
} as const satisfies Record<PaginationViewMode, readonly number[]>;

export function getDefaultItemsPerPage(viewMode: PaginationViewMode) {
  return DASHBOARD_ITEMS_PER_PAGE[viewMode];
}

export function getItemsPerPageOptions(viewMode: PaginationViewMode) {
  return DASHBOARD_ITEMS_PER_PAGE_OPTIONS[viewMode];
}

export function getPaginationState(
  totalItems: number,
  page: number,
  itemsPerPage: number,
) {
  if (itemsPerPage <= 0) {
    throw new Error("itemsPerPage must be greater than 0");
  }
  const pageCount = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const currentPage = Math.min(page, pageCount);
  const firstIndex =
    totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const lastIndex = Math.min(currentPage * itemsPerPage, totalItems);

  return {
    pageCount,
    currentPage,
    firstIndex,
    lastIndex,
  };
}

export function paginateItems<T>(
  items: T[],
  page: number,
  itemsPerPage: number,
) {
  const state = getPaginationState(items.length, page, itemsPerPage);

  return {
    ...state,
    items: items.slice(state.firstIndex - 1, state.lastIndex),
  };
}
