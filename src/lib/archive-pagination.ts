export const ITEMS_PER_PAGE = 6;

export function getPage(value?: string | readonly string[]) {
  const raw = typeof value === "string" ? value : value?.[0];
  if (!raw || !/^\d+$/.test(raw)) return 1;
  const page = Number(raw);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

export function getPagination(requestedPage: number, total: number) {
  const pageCount = Math.ceil(total / ITEMS_PER_PAGE);
  const page = Math.max(1, Math.min(requestedPage, pageCount || 1));
  const offset = (page - 1) * ITEMS_PER_PAGE;
  return {
    page,
    pageCount,
    offset,
    limit: ITEMS_PER_PAGE,
    start: total ? offset + 1 : 0,
    end: Math.min(offset + ITEMS_PER_PAGE, total),
    total,
  };
}

export function buildPageHref(pathname: string, search: string, page: number) {
  const params = new URLSearchParams(search);
  params.delete("page");
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function getPageItems(
  page: number,
  pageCount: number,
): Array<number | "ellipsis"> {
  const numbers = [
    ...new Set(
      [1, pageCount, page - 1, page, page + 1].filter(
        (value) => value >= 1 && value <= pageCount,
      ),
    ),
  ].sort((a, b) => a - b);
  const result: Array<number | "ellipsis"> = [];
  for (const [index, number] of numbers.entries()) {
    const previous = numbers[index - 1];
    if (previous && number - previous === 2) result.push(previous + 1);
    else if (previous && number - previous > 2) result.push("ellipsis");
    result.push(number);
  }
  return result;
}
