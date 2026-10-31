import type { Element, RootContent } from "hast";
import { fromHtml } from "hast-util-from-html";
import { toString as hastToString } from "hast-util-to-string";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ProjectsBatchActionsBar } from "@/features/dashboard/projects/components/projects-batch-actions";

function render(
  overrides: Partial<Parameters<typeof ProjectsBatchActionsBar>[0]> = {},
) {
  const html = renderToStaticMarkup(
    createElement(ProjectsBatchActionsBar, {
      selectedCount: 1,
      selectedProjects: [{ id: "storylio", title: "Storylio" }],
      outsideViewCount: 0,
      pageSelected: false,
      isPending: false,
      onSelectPage() {},
      onPublish() {},
      onMoveToDraft() {},
      onDelete() {},
      onCancel() {},
      ...overrides,
    }),
  );
  return fromHtml(html, { fragment: true });
}

function buttons(nodes: RootContent[]): Element[] {
  return nodes.flatMap((node) => {
    if (node.type !== "element") return [];
    return node.tagName === "button" ? [node] : buttons(node.children);
  });
}

describe("Projects batch action controls", () => {
  it("names the current page-selection action and selection scope", () => {
    const document = render({
      pageSelected: true,
      outsideViewCount: 2,
      selectedCount: 3,
    });
    expect(hastToString(document)).toContain("3 projects selected");
    expect(hastToString(document)).toContain("2 selected outside this page.");
    expect(hastToString(document)).toContain("Deselect page");
    expect(hastToString(document)).not.toContain("Select page");
    expect(buttons(document.children)[0]?.properties.ariaLabel).toBeUndefined();
  });

  it("allows choosing a page and cancelling when the selection is empty", () => {
    const controls = buttons(render({ selectedCount: 0 }).children);
    for (const button of controls) {
      const shouldDisable = ["Publish", "Move to draft", "Delete"].includes(
        hastToString(button).trim(),
      );
      expect(Boolean(button.properties.disabled), hastToString(button)).toBe(
        shouldDisable,
      );
    }
    expect(controls).toHaveLength(5);
  });

  it("locks all controls while a batch operation is pending", () => {
    const controls = buttons(render({ isPending: true }).children);
    expect(controls).toHaveLength(5);
    expect(controls.every((button) => button.properties.disabled)).toBe(true);
  });

  it("keeps the singular label and destructive confirmation trigger", () => {
    const document = render();
    expect(hastToString(document)).toContain("1 project selected");
    expect(hastToString(document)).toContain("Select page");
    const trigger = buttons(document.children).find(
      (button) => button.properties.dataSlot === "alert-dialog-trigger",
    );
    expect(trigger && hastToString(trigger).trim()).toBe("Delete");
    expect(trigger?.properties.ariaHasPopup).toBe("dialog");
  });
});
