import { compile } from "@mdx-js/mdx";
import {
  highlightMarkFromMarkdown,
  highlightMarkToMarkdown,
} from "mdast-util-highlight-mark";
import { highlightMark } from "micromark-extension-highlight-mark";
import remarkDirective from "remark-directive";
import remarkGfm from "remark-gfm";
import type { Processor } from "unified";

type MdxAstNode = {
  type?: string;
  depth?: number;
  name?: string;
  data?: {
    hName?: string;
    hProperties?: Record<string, unknown>;
  };
  children?: MdxAstNode[];
};

type UnifiedData = {
  micromarkExtensions?: unknown[];
  fromMarkdownExtensions?: unknown[];
  toMarkdownExtensions?: unknown[];
};

const admonitionTypes = new Set(["note", "tip", "info", "caution", "danger"]);

const unsafeMdxNodeTypes = new Set([
  "html",
  "mdxFlowExpression",
  "mdxTextExpression",
  "mdxJsxFlowElement",
  "mdxJsxTextElement",
  "mdxjsEsm",
]);

export function rejectExecutableMdx() {
  return (tree: MdxAstNode) => {
    const visit = (node: MdxAstNode) => {
      if (node.type && unsafeMdxNodeTypes.has(node.type)) {
        throw new Error(
          "MDX JSX, JavaScript expressions, imports, exports, and raw HTML are not allowed.",
        );
      }

      node.children?.forEach(visit);
    };

    visit(tree);
  };
}

export function normalizeHeadingDepths() {
  return (tree: MdxAstNode) => {
    const visit = (node: MdxAstNode) => {
      if (node.type === "heading" && node.depth === 1) {
        node.depth = 2;
      }

      node.children?.forEach(visit);
    };

    visit(tree);
  };
}

export function remarkHighlightMark(this: Processor) {
  const data = this.data() as UnifiedData;

  data.micromarkExtensions ??= [];
  data.fromMarkdownExtensions ??= [];
  data.toMarkdownExtensions ??= [];

  data.micromarkExtensions.push(highlightMark());
  data.fromMarkdownExtensions.push(highlightMarkFromMarkdown);
  data.toMarkdownExtensions.push(highlightMarkToMarkdown);

  return (tree: MdxAstNode) => {
    const visit = (node: MdxAstNode) => {
      if (node.type === "highlight") {
        node.data = {
          ...node.data,
          hName: "mark",
        };
      }

      node.children?.forEach(visit);
    };

    visit(tree);
  };
}

export function transformAdmonitionDirectives() {
  return (tree: MdxAstNode) => {
    const visit = (node: MdxAstNode) => {
      if (
        node.type === "containerDirective" &&
        node.name &&
        admonitionTypes.has(node.name)
      ) {
        node.data = {
          ...node.data,
          hName: "aside",
          hProperties: {
            className: [
              "storylio-admonition",
              `storylio-admonition-${node.name}`,
            ],
            "data-admonition": node.name,
          },
        };
      }

      node.children?.forEach(visit);
    };

    visit(tree);
  };
}

export async function getMdxSafetyError(source: string) {
  if (!source.trim()) return null;

  try {
    await compile(source, {
      remarkPlugins: [
        remarkDirective,
        remarkHighlightMark,
        rejectExecutableMdx,
        normalizeHeadingDepths,
        transformAdmonitionDirectives,
        remarkGfm,
      ],
    });
    return null;
  } catch (error) {
    return error instanceof Error
      ? error.message
      : "MDX content contains unsupported syntax.";
  }
}
