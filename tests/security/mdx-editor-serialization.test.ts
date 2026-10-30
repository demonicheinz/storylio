import { fromMarkdown } from "mdast-util-from-markdown";
import { toMarkdown } from "mdast-util-to-markdown";
import { describe, expect, it } from "vitest";
import { editorMarkdownOptions } from "@/features/dashboard/shared/utils/editor-markdown-options";
import { getMdxSafetyError } from "@/lib/mdx-safety";

describe("rich-text Markdown serialization", () => {
  it("preserves literal braces after import, edit and export", async () => {
    const tree = fromMarkdown("Kurung sebagai teks: \\{contoh\\}.");
    const text = tree.children[0];
    if (text.type !== "paragraph" || text.children[0].type !== "text")
      throw new Error("Unexpected fixture");
    text.children[0].value += " Edited.";
    const exported = toMarkdown(tree, editorMarkdownOptions);
    expect(exported).toContain("\\{contoh}");
    expect(await getMdxSafetyError(exported)).toBeNull();
  });
  it("leaves inline and fenced code braces untouched", async () => {
    const source =
      "`{inline}`\n\n```js\nfunction sapa(nama) {\n return `Halo, ${nama}!`;\n}\n```\n\n```\n<Contoh />\n{contoh}\n```";
    const exported = toMarkdown(fromMarkdown(source), editorMarkdownOptions);
    expect(exported).toContain("`{inline}`");
    expect(exported).toContain("${nama}");
    expect(exported).not.toContain("\\{nama}");
    expect(await getMdxSafetyError(exported)).toBeNull();
  });
});
