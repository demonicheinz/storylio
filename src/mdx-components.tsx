import type { MDXComponents } from "mdx/types";

const components: MDXComponents = {
  h2: ({ children }) => (
    <h2 className="font-heading text-2xl font-semibold text-foreground md:text-3xl">
      {children}
    </h2>
  ),
  p: ({ children }) => (
    <p className="text-base leading-8 text-muted-foreground">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="ml-5 flex list-disc flex-col gap-2 marker:text-brand-soft">
      {children}
    </ul>
  ),
  li: ({ children }) => (
    <li className="text-base leading-7 text-muted-foreground">{children}</li>
  ),
};

export function useMDXComponents(): MDXComponents {
  return components;
}
