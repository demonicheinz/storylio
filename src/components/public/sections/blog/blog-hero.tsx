import { Heading } from "@/components/common";

type BlogHeroProps = {
  totalPosts: number;
  totalTags: number;
  selectedTag?: string;
};

export function BlogHero({
  totalPosts,
  totalTags,
  selectedTag,
}: BlogHeroProps) {
  return (
    <section className="flex flex-col gap-8 pt-32 pb-10 md:pt-40 md:pb-14">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="mb-4 text-xs font-semibold tracking-[0.32em] text-brand-soft uppercase">
            Notes / craft / implementation
          </p>
          <Heading
            level="h1"
            variant="page"
            size="2xl"
            className="mb-5 text-foreground"
          >
            Writing from the{" "}
            <span className="text-brand-soft">building floor</span>.
          </Heading>
          <p className="max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
            Notes on web development, interface craft, systems thinking, and the
            decisions that show up while turning ideas into usable products.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:flex sm:min-w-72">
          <div className="rounded-3xl border border-border/40 bg-surface/65 p-4 shadow-[0_0_48px_rgba(139,92,246,0.08)] backdrop-blur-xl">
            <p className="text-3xl font-bold text-foreground">{totalPosts}</p>
            <p className="mt-1 text-xs tracking-widest text-muted-foreground uppercase">
              Published
            </p>
          </div>
          <div className="rounded-3xl border border-border/40 bg-surface/65 p-4 shadow-[0_0_48px_rgba(139,92,246,0.08)] backdrop-blur-xl">
            <p className="text-3xl font-bold text-foreground">{totalTags}</p>
            <p className="mt-1 text-xs tracking-widest text-muted-foreground uppercase">
              Topics
            </p>
          </div>
        </div>
      </div>

      {selectedTag && (
        <div className="w-fit rounded-full border border-brand-soft/30 bg-brand-soft/10 px-4 py-2 text-sm text-brand-soft">
          Reading articles tagged {selectedTag}
        </div>
      )}
    </section>
  );
}
