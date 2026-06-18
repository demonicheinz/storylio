import Image from "next/image";
import type { MDXComponents } from "next-mdx-remote-client/rsc";
import { evaluate } from "next-mdx-remote-client/rsc";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkDirective from "remark-directive";
import remarkGfm from "remark-gfm";
import { BlogHeadingLink } from "@/components/public/sections/blog/heading-link";
import {
  normalizeHeadingDepths,
  rejectExecutableMdx,
  remarkHighlightMark,
  transformAdmonitionDirectives,
} from "@/lib/mdx-safety";
import { cn } from "@/lib/utils";

function getSafeHref(href?: string) {
  if (!href) return undefined;
  if (href.startsWith("/") || href.startsWith("#")) return href;

  try {
    const url = new URL(href);
    return ["http:", "https:", "mailto:"].includes(url.protocol)
      ? href
      : undefined;
  } catch {
    return undefined;
  }
}

function getSafeImageSrc(src?: string) {
  if (!src) return null;
  if (src.startsWith("/")) return src;

  try {
    const url = new URL(src);
    return url.protocol === "https:" ? src : null;
  } catch {
    return null;
  }
}

function getTableCellAlign(align: unknown) {
  return align === "center" || align === "right" || align === "left"
    ? align
    : "left";
}

const components: MDXComponents = {
  h1: ({ children, className, id }) => (
    <BlogHeadingLink
      as="h2"
      id={typeof id === "string" ? id : undefined}
      className={cn(
        "mt-12 scroll-mt-28 font-heading text-3xl font-semibold text-foreground first:mt-0",
        className,
      )}
    >
      {children}
    </BlogHeadingLink>
  ),
  h2: ({ children, className, id }) => (
    <BlogHeadingLink
      as="h2"
      id={typeof id === "string" ? id : undefined}
      className={cn(
        "mt-12 scroll-mt-28 font-heading text-3xl font-semibold text-foreground first:mt-0",
        className,
      )}
    >
      {children}
    </BlogHeadingLink>
  ),
  h3: ({ children, className, id }) => (
    <BlogHeadingLink
      as="h3"
      id={typeof id === "string" ? id : undefined}
      className={cn(
        "mt-8 scroll-mt-28 font-heading text-2xl font-semibold text-foreground",
        className,
      )}
    >
      {children}
    </BlogHeadingLink>
  ),
  p: ({ children }) => (
    <p className="max-w-full text-base leading-8 wrap-break-word text-muted-foreground">
      {children}
    </p>
  ),
  a: ({ children, href }) => {
    const safeHref = getSafeHref(href);
    const isExternal = safeHref?.startsWith("http");

    return (
      <a
        href={safeHref}
        className="font-medium wrap-anywhere text-brand-soft underline-offset-4 hover:underline"
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
      >
        {children}
      </a>
    );
  },
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
    <li className="text-base leading-7 wrap-break-word text-muted-foreground">
      {children}
    </li>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-brand-soft/50 pl-5 text-foreground">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-10 border-border/60" />,
  mark: ({ children }) => (
    <mark className="rounded-md bg-brand-soft/20 px-1 py-0.5 text-foreground">
      {children}
    </mark>
  ),
  del: ({ children }) => (
    <del className="text-muted-foreground decoration-brand-soft/80 decoration-2">
      {children}
    </del>
  ),
  img: ({ alt, src }) => {
    const safeSrc = typeof src === "string" ? getSafeImageSrc(src) : null;
    if (!safeSrc) {
      return null;
    }

    return (
      <span className="relative my-8 block aspect-video w-full overflow-hidden rounded-2xl border border-border/40 bg-surface/60">
        <Image
          src={safeSrc}
          alt={alt ?? ""}
          fill
          sizes="(min-width: 1280px) 760px, calc(100vw - 3rem)"
          className="object-cover"
          unoptimized
        />
      </span>
    );
  },
  pre: ({ children }) => (
    <div className="max-w-full overflow-hidden rounded-2xl border border-border/40 bg-background/80">
      <pre className="max-w-full scrollbar-thin overflow-x-auto p-4 text-sm leading-7 whitespace-pre **:data-highlighted-chars:bg-transparent **:data-highlighted-line:bg-transparent [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-inherit [&_mark]:bg-transparent">
        {children}
      </pre>
    </div>
  ),
  code: ({ children }) => (
    <code className="rounded-md bg-brand-soft/10 px-1.5 py-0.5 font-mono text-sm wrap-anywhere text-brand-soft">
      {children}
    </code>
  ),
  input: ({ type, checked, className, ...props }) => {
    if (type !== "checkbox") {
      return <input type={type} className={className} {...props} />;
    }

    return (
      <input
        {...props}
        type="checkbox"
        checked={Boolean(checked)}
        readOnly
        className={cn("storylio-article-checkbox", className)}
      />
    );
  },
  table: ({ children }) => (
    <div className="my-8 max-w-full overflow-x-auto rounded-2xl border border-border/60">
      <table className="w-full min-w-max border-separate border-spacing-0 text-sm">
        {children}
      </table>
    </div>
  ),
  th: ({ align, children, className, style, ...props }) => (
    <th
      {...props}
      align={typeof align === "string" ? align : undefined}
      style={{ textAlign: getTableCellAlign(align), ...style }}
      className={cn(
        "border-r border-b border-border/60 bg-surface/70 px-4 py-3 font-semibold text-foreground last:border-r-0",
        className,
      )}
    >
      {children}
    </th>
  ),
  td: ({ align, children, className, style, ...props }) => (
    <td
      {...props}
      align={typeof align === "string" ? align : undefined}
      style={{ textAlign: getTableCellAlign(align), ...style }}
      className={cn(
        "border-r border-b border-border/40 px-4 py-3 text-muted-foreground last:border-r-0",
        className,
      )}
    >
      {children}
    </td>
  ),
};

export async function renderMDX(source: string) {
  const { content, error } = await evaluate({
    source,
    components,
    options: {
      disableExports: true,
      disableImports: true,
      mdxOptions: {
        remarkPlugins: [
          remarkDirective,
          remarkHighlightMark,
          rejectExecutableMdx,
          normalizeHeadingDepths,
          transformAdmonitionDirectives,
          remarkGfm,
        ],
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
