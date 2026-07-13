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
    <section className="flex flex-col gap-8 pt-32 md:pt-40 pb-10 md:pb-14">
      <div className="flex lg:flex-row flex-col lg:justify-between lg:items-end gap-6">
        <div className="max-w-3xl">
          <p className="mb-4 font-semibold text-brand-soft text-xs uppercase tracking-[0.32em]">
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
          <p className="max-w-2xl text-muted-foreground text-base md:text-lg leading-8">
            Notes on web development, interface craft, systems thinking, and the
            decisions that show up while turning ideas into usable products.
          </p>
        </div>

        <div className="gap-3 grid grid-cols-2 sm:w-72">
          <div className="bg-surface/65 shadow-[0_0_48px_rgba(139,92,246,0.08)] backdrop-blur-xl p-4 border border-border/40 rounded-3xl">
            <p className="font-bold text-foreground text-3xl">{totalPosts}</p>
            <p className="mt-1 text-muted-foreground text-xs uppercase tracking-widest">
              Published
            </p>
          </div>
          <div className="bg-surface/65 shadow-[0_0_48px_rgba(139,92,246,0.08)] backdrop-blur-xl p-4 border border-border/40 rounded-3xl">
            <p className="font-bold text-foreground text-3xl">{totalTags}</p>
            <p className="mt-1 text-muted-foreground text-xs uppercase tracking-widest">
              Topics
            </p>
          </div>
        </div>
      </div>

      {selectedTag && (
        <div className="bg-brand-soft/10 px-4 py-2 border border-brand-soft/30 rounded-full w-fit text-brand-soft text-sm">
          Reading articles tagged {selectedTag}
        </div>
      )}
    </section>
  );
}
