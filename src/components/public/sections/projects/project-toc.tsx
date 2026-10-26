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
      eyebrow="Case study"
      description="Jump between the decisions behind this project."
      ariaLabel="Project case study table of contents"
      indicator="line"
    />
  );
}
