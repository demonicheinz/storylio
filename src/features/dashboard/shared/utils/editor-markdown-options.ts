import type { Options } from "mdast-util-to-markdown";

/** Plain rich-text braces must not become executable MDX expressions on export. */
export const editorMarkdownOptions: Options = {
  listItemIndent: "one",
  unsafe: [{ character: "{", inConstruct: "phrasing" }],
};
