import { ContentToc } from "@/components/common";
import type { TocItem } from "@/components/public/sections/blog/types";

type ArticleTocProps = {
  items: TocItem[];
};

export function ArticleToc({ items }: ArticleTocProps) {
  return (
    <ContentToc
      items={items}
      eyebrow="On this page"
      ariaLabel="Article table of contents"
      indicator="line"
    />
  );
}
