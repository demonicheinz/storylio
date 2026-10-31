import detail from "@/components/public/public-detail.module.css";
import page from "@/components/public/public-page.module.css";
import reading from "@/components/public/reading.module.css";
import about from "@/components/public/sections/about/about.module.css";
import article from "@/components/public/sections/blog/article.module.css";
import blog from "@/components/public/sections/blog/blog.module.css";
import gallery from "@/components/public/sections/gallery/gallery.module.css";
import projectDetail from "@/components/public/sections/projects/project-detail.module.css";
import projects from "@/components/public/sections/projects/projects.module.css";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import loading from "./public-page-skeleton.module.css";

type PublicPageSkeletonProps = {
  variant?:
    | "collection"
    | "projects"
    | "blog"
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
function Header({ variant }: PublicPageSkeletonProps) {
  const hero =
    variant === "blog"
      ? blog.hero
      : variant === "gallery"
        ? gallery.hero
        : projects.hero;
  return (
    <div className={hero}>
      <Bar className="w-3/5 max-w-lg h-12 md:h-16" />
      <Bar className="w-full max-w-xl h-5" />
      <Bar className="w-4/5 max-w-md h-5" />
    </div>
  );
}
function Tags() {
  return (
    <div className="flex flex-wrap gap-2">
      {[1, 2, 3].map((key) => (
        <Bar key={key} className="w-16 h-7" />
      ))}
    </div>
  );
}
function Cards({ variant }: PublicPageSkeletonProps) {
  return (
    <div className={page.grid} data-skeleton-cards>
      {[1, 2, 3, 4, 5, 6].map((key) => (
        <div key={key} className={page.card}>
          <div className={page.cardMedia}>
            <Bar className="w-full aspect-video" />
          </div>
          <div className={page.cardBody}>
            {variant === "blog" && <Bar className="w-2/3 h-4" />}
            <Bar className="w-3/4 h-7" />
            <div className="py-2 w-full">
              <Lines />
            </div>
            <Tags />
            <Bar className="w-40 h-11" />
          </div>
        </div>
      ))}
    </div>
  );
}
function Reading() {
  return (
    <div className={reading.layout} data-has-toc data-skeleton-reading>
      <div className={reading.prose}>
        <Bar className="w-2/3 h-9" />
        <Lines />
        <Lines />
      </div>
      <aside className="space-y-4 py-5 border-border border-y xl:border-b-0">
        <Bar className="w-28 h-4" />
        <Bar className="w-40 max-w-full h-4" />
        <Bar className="w-32 h-4" />
      </aside>
    </div>
  );
}
function Detail({ variant }: PublicPageSkeletonProps) {
  return (
    <div className={`${page.container} ${detail.article}`}>
      <Bar className="w-32 h-11" />
      {variant === "project-detail" ? (
        <div className={projectDetail.overview}>
          <div className={projectDetail.intro}>
            <Bar className="w-4/5 h-12 md:h-16" />
            <div className="mt-6">
              <Lines />
            </div>
          </div>
          <div className={projectDetail.cover}>
            <Bar className="w-full aspect-video" />
          </div>
          <div className={projectDetail.facts}>
            {[1, 2, 3].map((key) => (
              <div key={key}>
                <Bar className="w-20 h-4" />
                <Bar className="w-full h-5" />
              </div>
            ))}
          </div>
          <div className={projectDetail.actions}>
            <Bar className="w-40 h-11" />
          </div>
          <div className={projectDetail.stack}>
            <Tags />
          </div>
        </div>
      ) : (
        <div className={article.overview}>
          <div className={article.header}>
            <Bar className="w-4/5 max-w-4xl h-12 md:h-16" />
            <div className="mt-6 max-w-2xl">
              <Lines />
            </div>
          </div>
          <div className={article.meta}>
            <Bar className="w-56 max-w-full h-5" />
            <Tags />
          </div>
          <div className={article.cover}>
            <Bar className="w-full aspect-video" />
          </div>
        </div>
      )}
      <div
        className={variant === "project-detail" ? page.section : article.body}
      >
        <Reading />
      </div>
    </div>
  );
}
function Content({ variant }: PublicPageSkeletonProps) {
  if (variant === "about")
    return (
      <div className={`${page.container} ${about.layout}`}>
        <div className="flex flex-col items-center">
          <Bar className="rounded-full size-24 md:size-36" />
          <Bar className="mt-6 w-40 h-4" />
        </div>
        <div>
          <Bar className="mx-auto md:mx-0 mb-6 w-4/5 h-14" />
          <Bar className="mx-auto md:mx-0 mb-6 w-48 h-4" />
          <Bar className="mb-6 w-56 h-11" />
          <Lines />
          <div className="mt-12 md:mt-16">
            <Bar className="mb-8 w-2/3 h-9" />
            <Lines />
          </div>
        </div>
      </div>
    );
  if (variant === "project-detail" || variant === "post-detail")
    return <Detail variant={variant} />;
  const toolbar =
    variant === "blog"
      ? blog.toolbar
      : variant === "gallery"
        ? gallery.toolbar
        : projects.filterBar;
  const collection =
    variant === "blog"
      ? blog.collection
      : variant === "gallery"
        ? gallery.collection
        : projects.collection;
  return (
    <div className={page.container}>
      <Header variant={variant} />
      <div className={toolbar}>
        {variant === "blog" ? (
          <>
            <div className="flex gap-2">
              <Bar className="w-20 h-11" />
              <Bar className="w-20 h-11" />
            </div>
            <Bar className="w-24 h-4" />
            <div className={blog.topic}>
              <Bar className="w-full h-11" />
            </div>
          </>
        ) : (
          <>
            <Bar className="w-24 h-4" />
            <div
              className={
                variant === "gallery" ? gallery.filter : projects.filterControl
              }
            >
              <Bar className="w-full h-11" />
            </div>
          </>
        )}
      </div>
      <div className={collection}>
        {variant === "gallery" ? (
          <div className={loading.masonryContainer}>
            <div className={loading.masonry} data-skeleton-masonry>
              {[
                "aspect-3/4",
                "aspect-square",
                "aspect-4/3",
                "aspect-square",
                "aspect-3/4",
                "aspect-4/3",
              ].map((aspect, index) => (
                <div
                  className={loading.photo}
                  // biome-ignore lint/suspicious/noArrayIndexKey: Skeleton cells are fixed decorative layout positions with no mutable item state.
                  key={index}
                >
                  <Bar className={`w-full ${aspect}`} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <Cards variant={variant} />
        )}
      </div>
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
