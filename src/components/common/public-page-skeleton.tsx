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

function Placeholder({ className }: { className: string }) {
  return (
    <Skeleton
      className={cn("bg-foreground/6 rounded-lg animate-none", className)}
    />
  );
}

function TextLines() {
  return (
    <div className="space-y-3">
      <Placeholder className="w-full h-3" />
      <Placeholder className="w-11/12 h-3" />
      <Placeholder className="w-3/4 h-3" />
    </div>
  );
}

function CollectionHeader() {
  return (
    <div className="flex lg:flex-row flex-col lg:justify-between lg:items-end gap-6 pt-32 md:pt-40 pb-10 md:pb-14">
      <div className="w-full min-w-0 max-w-3xl">
        <Placeholder className="bg-brand-soft/15 mb-5 rounded-full w-52 h-3" />
        <div className="space-y-3 mb-6">
          <Placeholder className="w-4/5 h-11 sm:h-14 md:h-16" />
          <Placeholder className="bg-brand-soft/10 w-3/5 h-11 sm:h-14 md:h-16" />
        </div>
        <div className="space-y-3 max-w-xl">
          <Placeholder className="w-full h-4" />
          <Placeholder className="w-4/5 h-4" />
        </div>
      </div>
      <div className="gap-3 grid grid-cols-2 sm:w-72 lg:shrink-0">
        {["count", "categories"].map((key) => (
          <div
            key={key}
            className="bg-surface/65 p-4 border border-border/40 rounded-3xl"
          >
            <Placeholder className="mb-3 w-10 h-8" />
            <Placeholder className="rounded-full w-16 h-2.5" />
          </div>
        ))}
      </div>
    </div>
  );
}

function FilterBar() {
  return (
    <div className="bg-surface/55 px-4 sm:px-5 py-4 border border-border/30 rounded-3xl">
      <Placeholder className="mb-3 rounded-full w-24 h-2.5" />
      <div className="flex gap-2 overflow-hidden">
        {["w-16", "w-24", "w-20", "w-28", "w-20"].map((width, index) => (
          <Placeholder
            key={`${width}-${index}`}
            className={cn(
              "rounded-full h-8 shrink-0",
              width,
              index === 0 && "bg-brand-soft/15",
            )}
          />
        ))}
      </div>
    </div>
  );
}

function FeaturedContent() {
  return (
    <div className="lg:items-center gap-6 lg:gap-8 grid lg:grid-cols-[3fr_2fr] bg-surface/55 p-3 md:p-4 border border-border/40 rounded-4xl">
      <Placeholder className="rounded-3xl w-full aspect-video" />
      <div className="px-2 lg:pr-6 pb-3">
        <div className="flex gap-2 mb-5">
          <Placeholder className="bg-brand-soft/10 rounded-full w-20 h-6" />
          <Placeholder className="rounded-full w-16 h-6" />
        </div>
        <Placeholder className="mb-3 w-4/5 h-8" />
        <Placeholder className="mb-6 w-3/5 h-8" />
        <TextLines />
        <div className="flex justify-between items-center mt-7">
          <Placeholder className="rounded-full w-24 h-3" />
          <Placeholder className="rounded-full size-9" />
        </div>
      </div>
    </div>
  );
}

function GalleryContent() {
  return (
    <div className="gap-3.5 sm:gap-4.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {["landscape", "portrait", "square"].map((shape) => (
        <div key={shape} className="space-y-4.5">
          <Placeholder
            className={cn(
              "border border-border/30 rounded-3xl w-full",
              shape === "landscape" && "aspect-4/3",
              shape === "portrait" && "aspect-3/4",
              shape === "square" && "aspect-square",
            )}
          />
          <Placeholder className="border border-border/30 rounded-3xl w-full aspect-4/3" />
        </div>
      ))}
    </div>
  );
}

function AboutContent() {
  return (
    <div className="flex md:flex-row flex-col gap-8 lg:gap-10 mx-auto px-4 sm:px-6 lg:px-8 pt-38 md:pt-40 w-full max-w-264">
      <div className="flex justify-center md:justify-start md:w-70 lg:w-80 shrink-0">
        <div className="flex flex-col items-center md:items-start gap-5 bg-surface/70 p-5 border border-border/40 rounded-3xl md:w-full h-fit">
          <Placeholder className="rounded-full size-40" />
          <Placeholder className="rounded-full w-32 h-3" />
          <div className="flex gap-2">
            <Placeholder className="rounded-full w-20 h-7" />
            <Placeholder className="rounded-full w-16 h-7" />
          </div>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <Placeholder className="mb-4 w-4/5 h-11 md:h-14" />
        <Placeholder className="bg-brand-soft/10 mb-8 w-3/5 h-5" />
        <TextLines />
        <div className="flex gap-3 mt-8">
          <Placeholder className="rounded-full w-28 h-10" />
          <Placeholder className="rounded-full size-10" />
          <Placeholder className="rounded-full size-10" />
        </div>
        <div className="mt-16 pt-10 border-border/30 border-t">
          <Placeholder className="mb-7 w-2/3 h-8" />
          <TextLines />
        </div>
      </div>
    </div>
  );
}

function DetailBody() {
  return (
    <div className="items-start gap-10 grid xl:grid-cols-[minmax(0,1fr)_280px] mt-16 md:mt-20">
      <div className="space-y-8 pl-5 sm:pl-8 lg:pl-10 border-border/30 border-l min-w-0">
        <Placeholder className="w-2/3 h-8" />
        <TextLines />
        <TextLines />
      </div>
      <div className="hidden xl:block space-y-5 pl-5 border-border/30 border-l">
        <Placeholder className="bg-brand-soft/15 rounded-full w-24 h-3" />
        <Placeholder className="w-4/5 h-3" />
        <Placeholder className="w-3/5 h-3" />
        <Placeholder className="w-2/3 h-3" />
      </div>
    </div>
  );
}

function ProjectDetailContent() {
  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 pt-32 lg:pt-40 w-full max-w-7xl">
      <Placeholder className="mb-8 rounded-full w-40 h-9" />
      <div className="lg:items-start gap-6 md:gap-8 grid lg:grid-cols-[1.08fr_0.92fr]">
        <Placeholder className="rounded-3xl w-full aspect-video" />
        <div className="bg-surface/65 p-6 md:p-8 lg:p-9 border border-border/40 rounded-3xl min-w-0">
          <div className="flex gap-2 mb-6">
            <Placeholder className="bg-brand-soft/10 rounded-full w-20 h-6" />
            <Placeholder className="rounded-full w-16 h-6" />
            <Placeholder className="rounded-full w-20 h-6" />
          </div>
          <Placeholder className="mb-3 w-full h-10 md:h-12" />
          <Placeholder className="w-2/3 h-10 md:h-12" />
          <div className="mt-6">
            <TextLines />
          </div>
          <div className="gap-4 grid grid-cols-2 sm:grid-cols-3 mt-8 py-5 border-border/40 border-y">
            {["contribution", "updated", "reading-time"].map((key) => (
              <div key={key} className="space-y-3">
                <Placeholder className="rounded-full w-12 h-2" />
                <Placeholder className="w-4/5 h-3" />
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-7">
            <Placeholder className="rounded-full w-28 h-9" />
            <Placeholder className="rounded-full w-24 h-9" />
          </div>
        </div>
      </div>
      <DetailBody />
    </div>
  );
}

function PostDetailContent() {
  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 pt-32 lg:pt-40 w-full max-w-7xl">
      <div className="flex justify-between items-center gap-3 mb-8">
        <Placeholder className="rounded-full w-36 h-9" />
        <Placeholder className="rounded-full w-24 h-9" />
      </div>
      <div className="max-w-4xl">
        <Placeholder className="bg-brand-soft/15 mb-5 rounded-full w-44 h-3" />
        <Placeholder className="mb-3 w-full h-11 md:h-16 lg:h-20" />
        <Placeholder className="w-3/4 h-11 md:h-16 lg:h-20" />
        <div className="space-y-3 mt-6 max-w-3xl">
          <Placeholder className="w-full h-4" />
          <Placeholder className="w-4/5 h-4" />
        </div>
      </div>
      <div className="flex sm:flex-row flex-col sm:justify-between sm:items-center gap-4 my-7 py-5 border-border/30 border-y">
        <div className="flex items-center gap-3">
          <Placeholder className="rounded-full w-24 h-3" />
          <Placeholder className="rounded-full w-16 h-3" />
        </div>
        <div className="flex gap-2">
          <Placeholder className="bg-brand-soft/10 rounded-full w-20 h-6" />
          <Placeholder className="rounded-full w-16 h-6" />
          <Placeholder className="rounded-full w-20 h-6" />
        </div>
      </div>
      <Placeholder className="rounded-3xl w-full aspect-video" />
      <DetailBody />
    </div>
  );
}

function PageContent({ variant }: PublicPageSkeletonProps) {
  if (variant === "about") return <AboutContent />;
  if (variant === "project-detail") return <ProjectDetailContent />;
  if (variant === "post-detail") return <PostDetailContent />;

  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 w-full max-w-295">
      <CollectionHeader />
      <FilterBar />
      <Placeholder className="mt-5 mb-8 md:mb-10 rounded-full w-40 h-3" />
      {variant === "gallery" ? <GalleryContent /> : <FeaturedContent />}
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
      className="pb-24 min-h-screen overflow-x-clip"
    >
      <span className="sr-only">Loading content. Please wait.</span>
      <div aria-hidden="true" className="motion-safe:animate-pulse">
        <PageContent variant={variant} />
      </div>
    </div>
  );
}
