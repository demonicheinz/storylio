import { compile } from "@mdx-js/mdx";
import remarkGfm from "remark-gfm";

type MdxAstNode = {
  type?: string;
  children?: MdxAstNode[];
};

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

export async function getMdxSafetyError(source: string) {
  if (!source.trim()) return null;

  try {
    await compile(source, {
      remarkPlugins: [rejectExecutableMdx, remarkGfm],
    });
    return null;
  } catch (error) {
    return error instanceof Error
      ? error.message
      : "MDX content contains unsupported syntax.";
  }
}
