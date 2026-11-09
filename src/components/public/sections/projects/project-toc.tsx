import {
  ContentToc,
  type ContentTocItem,
} from "@/components/common/content-toc";

type ProjectTocProps = {
  items: ContentTocItem[];
};

export function ProjectToc({ items }: ProjectTocProps) {
  return (
    <ContentToc
      items={items}
      eyebrow="On this page"
      ariaLabel="Project case study table of contents"
      indicator="line"
      collapsible
    />
  );
}
