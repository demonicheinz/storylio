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
        "mt-12 first:mt-0 font-heading font-semibold text-foreground text-3xl scroll-mt-28",
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
        "mt-12 first:mt-0 font-heading font-semibold text-foreground text-3xl scroll-mt-28",
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
        "mt-8 font-heading font-semibold text-foreground text-2xl scroll-mt-28",
        className,
      )}
    >
      {children}
    </BlogHeadingLink>
  ),
  p: ({ children }) => (
    <p className="max-w-full text-muted-foreground text-base wrap-break-word leading-8">
      {children}
    </p>
  ),
  a: ({ children, href }) => {
    const safeHref = getSafeHref(href);
    const isExternal = safeHref?.startsWith("http");

    return (
      <a
        href={safeHref}
        className="font-medium text-brand-soft hover:underline underline-offset-4 wrap-anywhere"
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
      >
        {children}
      </a>
    );
  },
  ul: ({ children }) => (
    <ul className="flex flex-col gap-2 ml-5 marker:text-brand-soft list-disc">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="flex flex-col gap-2 ml-5 marker:text-brand-soft list-decimal">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="text-muted-foreground text-base wrap-break-word leading-7">
      {children}
    </li>
  ),
  blockquote: ({ children }) => (
    <blockquote className="pl-5 border-brand-soft/50 border-l-2 text-foreground">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-10 border-border/60" />,
  mark: ({ children }) => (
    <mark className="bg-brand-soft/20 px-1 py-0.5 rounded-md text-foreground">
      {children}
    </mark>
  ),
  del: ({ children }) => (
    <del className="text-muted-foreground decoration-2 decoration-brand-soft/80">
      {children}
    </del>
  ),
  img: ({ alt, src }) => {
    const safeSrc = typeof src === "string" ? getSafeImageSrc(src) : null;
    if (!safeSrc) {
      return null;
    }

    return (
      <span className="block relative bg-surface/60 my-8 border border-border/40 rounded-2xl w-full aspect-video overflow-hidden">
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
    <div className="bg-background/80 border border-border/40 rounded-2xl max-w-full overflow-hidden">
      <pre className="[&_code]:bg-transparent [&_mark]:bg-transparent **:data-highlighted-chars:bg-transparent **:data-highlighted-line:bg-transparent p-4 [&_code]:p-0 max-w-full overflow-x-auto [&_code]:text-inherit text-sm leading-7 whitespace-pre scrollbar-thin">
        {children}
      </pre>
    </div>
  ),
  code: ({ children }) => (
    <code className="bg-brand-soft/10 px-1.5 py-0.5 rounded-md font-mono text-brand-soft text-sm wrap-anywhere">
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
    <div className="my-8 border border-border/60 rounded-2xl max-w-full overflow-x-auto">
      <table className="w-full min-w-max text-sm border-separate border-spacing-0">
        {children}
      </table>
    </div>
  ),
  th: ({ align, children, className, style, ...props }) => (
    <th
      {...props}
      style={{ textAlign: getTableCellAlign(align), ...style }}
      className={cn(
        "bg-surface/70 px-4 py-3 border-border/60 border-r last:border-r-0 border-b font-semibold text-foreground",
        className,
      )}
    >
      {children}
    </th>
  ),
  td: ({ align, children, className, style, ...props }) => (
    <td
      {...props}
      style={{ textAlign: getTableCellAlign(align), ...style }}
      className={cn(
        "px-4 py-3 border-border/40 border-r last:border-r-0 border-b text-muted-foreground",
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
