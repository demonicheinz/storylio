import detail from "@/components/public/public-detail.module.css";
import page from "@/components/public/public-page.module.css";
import about from "@/components/public/sections/about/about.module.css";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type PublicPageSkeletonProps = {
  variant?:
    | "collection"
    | "about"
    | "gallery"
    | "project-detail"
    | "post-detail";
};
function Bar({ className }: { className: string }) {
  return (
    <Skeleton
      className={cn("bg-surface-2 rounded-md animate-none", className)}
    />
  );
}
function Lines() {
  return (
    <div className="space-y-4">
      <Bar className="w-full h-4" />
      <Bar className="w-11/12 h-4" />
      <Bar className="w-3/4 h-4" />
    </div>
  );
}
function Header() {
  return (
    <div className={page.hero}>
      <Bar className="h-12 md:h-14 w-4/5 max-w-xl" />
      <div className="w-full max-w-xl">
        <Lines />
      </div>
      <Bar className="w-48 h-4" />
    </div>
  );
}
function Cards() {
  return (
    <div className={page.grid}>
      {[1, 2, 3].map((key) => (
        <div key={key} className={page.card}>
          <Bar className="w-full aspect-video" />
          <div className={page.cardBody}>
            <Bar className="w-3/4 h-7" />
            <Lines />
          </div>
        </div>
      ))}
    </div>
  );
}
function Content({ variant }: PublicPageSkeletonProps) {
  if (variant === "about")
    return (
      <div className={`${page.container} ${about.layout}`}>
        <div className="flex flex-col items-center md:items-start">
          <Bar className="size-24 md:size-36 rounded-full" />
          <Bar className="w-40 h-4 mt-6" />
        </div>
        <div>
          <Bar className="w-4/5 h-14 mb-6 mx-auto md:mx-0" />
          <Bar className="w-48 h-4 mb-6 mx-auto md:mx-0" />
          <Bar className="w-56 h-11 mb-6" />
          <Lines />
          <div className="mt-12 md:mt-16">
            <Bar className="w-2/3 h-9 mb-8" />
            <Lines />
          </div>
        </div>
      </div>
    );
  if (variant === "project-detail" || variant === "post-detail")
    return (
      <div className={`${page.container} ${detail.article}`}>
        <Bar className="w-32 h-11" />
        <div className={detail.articleHeader}>
          <Bar className="w-4/5 h-14 mb-8" />
          <Lines />
          <Bar className="w-2/3 h-4 mt-8" />
        </div>
        <Bar className="w-full aspect-video" />
        <div className="max-w-3xl mt-16">
          <Lines />
        </div>
      </div>
    );
  return (
    <div className={page.container}>
      <Header />
      <div className={`${page.filters} mb-12`}>
        {[1, 2, 3, 4].map((key) => (
          <Bar key={key} className="w-20 h-11" />
        ))}
      </div>
      {variant === "gallery" ? (
        <div className={page.grid}>
          {[1, 2, 3].map((key) => (
            <Bar key={key} className="w-full aspect-3/4" />
          ))}
        </div>
      ) : (
        <Cards />
      )}
    </div>
  );
}
export function PublicPageSkeleton({
  variant = "collection",
}: PublicPageSkeletonProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading page"
      data-loading-variant={variant}
      className={page.page}
    >
      <span className="sr-only">Loading content. Please wait.</span>
      <div aria-hidden="true">
        <Content variant={variant} />
      </div>
    </div>
  );
}
