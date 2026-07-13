import { Heading } from "@/components/common";

type GalleryHeroProps = {
  totalItems: number;
  totalCategories: number;
};

export function GalleryHero({ totalItems, totalCategories }: GalleryHeroProps) {
  return (
    <section className="flex flex-col gap-8 pt-32 md:pt-40 pb-10 md:pb-14">
      <div className="flex lg:flex-row flex-col lg:justify-between lg:items-end gap-6">
        <div className="max-w-3xl">
          <p className="mb-4 font-semibold text-brand-soft text-xs uppercase tracking-[0.32em]">
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
          <p className="max-w-2xl text-muted-foreground text-base md:text-lg leading-8">
            A small archive of interface details, work-in-progress fragments,
            places, and moments that shape Storylio&apos;s visual language.
          </p>
        </div>

        <div className="gap-3 grid grid-cols-2 sm:w-72">
          <div className="bg-surface/65 shadow-[0_0_48px_rgba(139,92,246,0.08)] backdrop-blur-xl p-4 border border-border/40 rounded-3xl">
            <p className="font-bold text-foreground text-3xl">{totalItems}</p>
            <p className="mt-1 text-muted-foreground text-xs uppercase tracking-widest">
              Frames
            </p>
          </div>
          <div className="bg-surface/65 shadow-[0_0_48px_rgba(139,92,246,0.08)] backdrop-blur-xl p-4 border border-border/40 rounded-3xl">
            <p className="font-bold text-foreground text-3xl">
              {totalCategories}
            </p>
            <p className="mt-1 text-muted-foreground text-xs uppercase tracking-widest">
              Categories
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
