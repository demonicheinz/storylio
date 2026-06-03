import { Heading } from "@/components/common";

type GalleryHeroProps = {
  totalItems: number;
  totalCategories: number;
};

export function GalleryHero({ totalItems, totalCategories }: GalleryHeroProps) {
  return (
    <section className="flex flex-col gap-8 pt-32 pb-10 md:pt-40 md:pb-14">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="mb-4 text-xs font-semibold tracking-[0.32em] text-brand-soft uppercase">
            Gallery / visual notes / references
          </p>
          <Heading
            level="h1"
            variant="page"
            size="2xl"
            className="mb-5 text-foreground"
          >
            Visual notes from the <span className="text-brand-soft">build</span>
            .
          </Heading>
          <p className="max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
            A small archive of interface details, work-in-progress fragments,
            places, and moments that shape Storylio&apos;s visual language.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:flex sm:min-w-72">
          <div className="rounded-3xl border border-border/40 bg-surface/65 p-4 shadow-[0_0_48px_rgba(139,92,246,0.08)] backdrop-blur-xl">
            <p className="text-3xl font-bold text-foreground">{totalItems}</p>
            <p className="mt-1 text-xs tracking-widest text-muted-foreground uppercase">
              Frames
            </p>
          </div>
          <div className="rounded-3xl border border-border/40 bg-surface/65 p-4 shadow-[0_0_48px_rgba(139,92,246,0.08)] backdrop-blur-xl">
            <p className="text-3xl font-bold text-foreground">
              {totalCategories}
            </p>
            <p className="mt-1 text-xs tracking-widest text-muted-foreground uppercase">
              Categories
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
