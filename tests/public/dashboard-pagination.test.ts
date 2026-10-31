import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DashboardPagination } from "@/features/dashboard/shared/components/pagination";
import { htmlText } from "../helpers/html-text";

function render(page: number, total = 100) {
  return renderToStaticMarkup(
    createElement(DashboardPagination, {
      firstIndex: total ? (page - 1) * 10 + 1 : 0,
      lastIndex: Math.min(page * 10, total),
      total,
      page,
      pageCount: Math.max(1, Math.ceil(total / 10)),
      itemsPerPage: 10,
      itemsPerPageOptions: [10, 20, 40],
      onPageChange() {},
      onItemsPerPageChange() {},
    }),
  );
}

describe("shared dashboard pagination", () => {
  it.each([
    [1, true, false],
    [5, false, false],
    [10, false, true],
  ] as const)(
    "keeps page %i navigation bounded",
    (page, previousDisabled, nextDisabled) => {
      const html = render(page);
      for (const [label, disabled] of [
        ["Previous page", previousDisabled],
        ["Next page", nextDisabled],
      ] as const) {
        const button = html.match(
          new RegExp(`<button[^>]*aria-label="${label}"[^>]*>`),
        )?.[0];
        expect(button).toBeDefined();
        expect(button?.includes('disabled=""')).toBe(disabled);
      }
      expect(html).toContain(`aria-label="Page ${page}" aria-current="page"`);
    },
  );
  it("keeps the range and compact page gap without losing the current page", () => {
    const html = render(5);
    expect(htmlText(html)).toContain("Showing 41 to 50 of 100 items");
    expect(htmlText(html)).toContain("Page 5 of 10");
    expect(htmlText(html)).toContain("…");
    expect(html).toContain('aria-label="Items per page"');
  });
  it("renders an honest empty range with both directions disabled", () => {
    const html = render(1, 0);
    expect(htmlText(html)).toContain("Showing 0 to 0 of 0 items");
    expect(html.match(/ disabled=""/g)).toHaveLength(2);
  });
});
