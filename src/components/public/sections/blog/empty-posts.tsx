import { ArticleIcon } from "@phosphor-icons/react/dist/ssr";

type EmptyPostsProps = {
  selectedTag?: string;
};

export function EmptyPosts({ selectedTag }: EmptyPostsProps) {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-dashed border-border/60 bg-surface/45 p-8 text-center shadow-[0_0_48px_rgba(139,92,246,0.08)] backdrop-blur-xl">
      <div className="mb-5 flex size-14 items-center justify-center rounded-full border border-brand-soft/35 bg-brand-soft/10 text-brand-soft">
        <ArticleIcon size={24} />
      </div>
      <h2 className="font-heading text-2xl font-semibold text-foreground">
        No articles found
      </h2>
      <p className="mt-3 max-w-md text-sm leading-7 text-muted-foreground">
        {selectedTag
          ? `There are no published articles tagged ${selectedTag} yet. Try another topic or reset the filter.`
          : "Published writing will appear here once it is available from the CMS."}
      </p>
    </div>
  );
}
