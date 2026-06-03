import type { MDXComponents } from "next-mdx-remote-client/rsc";
import { evaluate } from "next-mdx-remote-client/rsc";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

const components: MDXComponents = {
  h2: ({ children, className, ...props }) => (
    <h2
      className={cn(
        "mt-12 scroll-mt-28 font-heading text-3xl font-semibold text-foreground first:mt-0",
        className,
      )}
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, className, ...props }) => (
    <h3
      className={cn(
        "mt-8 scroll-mt-28 font-heading text-2xl font-semibold text-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="text-base leading-8 text-muted-foreground">{children}</p>
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      className="font-medium text-brand-soft underline-offset-4 hover:underline"
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noreferrer" : undefined}
    >
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="ml-5 flex list-disc flex-col gap-2 marker:text-brand-soft">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="ml-5 flex list-decimal flex-col gap-2 marker:text-brand-soft">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="text-base leading-7 text-muted-foreground">{children}</li>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-brand-soft/50 pl-5 text-foreground">
      {children}
    </blockquote>
  ),
  img: ({ alt, src }) => (
    <img
      src={src}
      alt={alt ?? ""}
      className="my-8 aspect-video w-full rounded-2xl border border-border/40 object-cover"
    />
  ),
  pre: ({ children }) => (
    <pre className="overflow-x-auto rounded-2xl border border-border/40 bg-background/80 p-4 text-sm leading-7">
      {children}
    </pre>
  ),
  code: ({ children }) => (
    <code className="rounded-md bg-brand-soft/10 px-1.5 py-0.5 font-mono text-sm text-brand-soft">
      {children}
    </code>
  ),
};

export async function renderMDX(source: string) {
  const { content, error } = await evaluate({
    source,
    components,
    options: {
      disableImports: true,
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          rehypeSlug,
          [
            rehypePrettyCode,
            {
              theme: "vesper",
            },
          ],
        ],
      },
    },
  });

  if (error) {
    throw error;
  }

  return content;
}
