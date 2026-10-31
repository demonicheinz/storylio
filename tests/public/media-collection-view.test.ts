import type { Element, RootContent } from "hast";
import { fromHtml } from "hast-util-from-html";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  MediaCard,
  MediaListHeader,
  MediaListRow,
} from "@/features/dashboard/media/components/media-collection-view";
import type { MediaItem } from "@/features/dashboard/media/types";
import { htmlText } from "../helpers/html-text";

vi.mock("@/features/dashboard/media/components/media-thumbnail", () => ({
  MediaThumbnail: () => createElement("div", { "data-preview": true }),
}));
const item: MediaItem = {
  id: "one",
  url: "/one.webp",
  publicId: "fixture/one",
  filename: "interface.design.preview.webp",
  size: 1536,
  format: "webp",
  width: 1200,
  height: 800,
  aspectRatio: 1.5,
  blurDataUrl: null,
  createdAt: "2026-10-30T00:00:00Z",
};
const callbacks = {
  onSelect() {},
  onRename() {},
  onToggleSelection() {},
  onCopy() {},
  onDelete() {},
  async onDownload() {},
};
function buttons(nodes: RootContent[]): Element[] {
  return nodes.flatMap((node) => {
    if (node.type !== "element") return [];
    return node.tagName === "button" ? [node] : buttons(node.children);
  });
}
describe("media collection renderers", () => {
  for (const [name, View] of [
    ["grid", MediaCard],
    ["list", MediaListRow],
  ] as const) {
    it(`${name} reserves batch Tab stops for its checkbox and menu`, () => {
      for (const isSelectionMode of [false, true]) {
        const html = renderToStaticMarkup(
          createElement(View, {
            item,
            ...callbacks,
            isSelected: false,
            isSelectionMode,
            isPending: false,
          }),
        );
        const controls = buttons(fromHtml(html, { fragment: true }).children);
        const previews = controls.filter(
          (button) =>
            button.properties.role !== "checkbox" &&
            button.properties.ariaHasPopup !== "menu",
        );
        expect(previews.length).toBeGreaterThan(0);
        expect(
          previews.every(
            (button) =>
              (button.properties.tabIndex ?? 0) === (isSelectionMode ? -1 : 0),
          ),
        ).toBe(true);
        const menu = controls.find(
          (button) => button.properties.ariaHasPopup === "menu",
        );
        expect(menu?.properties.tabIndex).not.toBe(-1);
        if (isSelectionMode) {
          expect(
            controls.find((button) => button.properties.role === "checkbox")
              ?.properties.tabIndex,
          ).not.toBe(-1);
        }
      }
    });
    it(`${name} preserves names, extensions and metadata`, () => {
      const html = renderToStaticMarkup(
        createElement(View, {
          item,
          ...callbacks,
          isSelected: false,
          isSelectionMode: false,
          isPending: false,
        }),
      );
      expect(html).toContain(`aria-label="Preview ${item.filename}"`);
      expect(html).toContain("data-media-extension");
      expect(htmlText(html)).toContain(".webp");
      expect(htmlText(html)).toContain("1.5 KB");
      expect(htmlText(html)).toContain("1200 × 800");
    });
    it(`${name} exposes selection state while pending controls stay disabled`, () => {
      const html = renderToStaticMarkup(
        createElement(View, {
          item,
          ...callbacks,
          isSelected: true,
          isSelectionMode: true,
          isPending: true,
        }),
      );
      expect(html).toContain(`aria-label="Select ${item.filename}"`);
      expect(html).toContain('aria-pressed="true"');
      expect(html).toContain('aria-checked="true"');
      const buttons = html.match(/<button\b[^>]*>/g) ?? [];
      expect(buttons.length).toBeGreaterThan(0);
      expect(buttons.every((button) => button.includes('disabled=""'))).toBe(
        true,
      );
    });
  }
  it("keeps the list header labels and selected column recipe", () => {
    const normal = renderToStaticMarkup(
      createElement(MediaListHeader, { selecting: false }),
    );
    const selected = renderToStaticMarkup(
      createElement(MediaListHeader, { selecting: true }),
    );
    expect(htmlText(normal)).toBe("NameSizeDimensionsActions");
    expect(selected).toContain("44px_minmax");
    expect(normal).not.toContain("44px_minmax");
  });
});
