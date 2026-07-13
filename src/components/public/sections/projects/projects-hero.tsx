import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr";
import { Heading } from "@/components/common";

type ProjectsHeroProps = {
  totalProjects: number;
  totalTech: number;
  selectedTech?: string;
};

export function ProjectsHero({
  totalProjects,
  totalTech,
  selectedTech,
}: ProjectsHeroProps) {
  return (
    <section className="flex flex-col gap-8 pt-32 md:pt-40 pb-10 md:pb-14">
      <div className="flex lg:flex-row flex-col lg:justify-between lg:items-end gap-6">
        <div className="max-w-3xl">
          <p className="mb-4 font-semibold text-brand-soft text-xs uppercase tracking-[0.32em]">
            Selected works / case studies / experiments
          </p>
          <Heading
            level="h1"
            variant="page"
            size="2xl"
            className="mb-5 text-foreground"
          >
            Projects shaped for{" "}
            <span className="text-brand-soft">real use</span>.
          </Heading>
          <p className="max-w-2xl text-muted-foreground text-base md:text-lg leading-8">
            A focused archive of shipped interfaces, full-stack builds, and web
            experiments. Each project is selected for the decisions behind it:
            performance, clarity, and the little interaction details that make a
            product feel finished.
          </p>
        </div>

        <div className="gap-3 grid grid-cols-2 sm:w-72">
          <div className="bg-surface/65 shadow-[0_0_48px_rgba(139,92,246,0.08)] backdrop-blur-xl p-4 border border-border/40 rounded-3xl">
            <p className="font-bold text-foreground text-3xl">
              {totalProjects}
            </p>
            <p className="mt-1 text-muted-foreground text-xs uppercase tracking-widest">
              Published
            </p>
          </div>
          <div className="bg-surface/65 shadow-[0_0_48px_rgba(139,92,246,0.08)] backdrop-blur-xl p-4 border border-border/40 rounded-3xl">
            <p className="font-bold text-foreground text-3xl">{totalTech}</p>
            <p className="mt-1 text-muted-foreground text-xs uppercase tracking-widest">
              Stacks
            </p>
          </div>
        </div>
      </div>

      {selectedTech && (
        <div className="flex items-center gap-2 bg-brand-soft/10 px-4 py-2 border border-brand-soft/30 rounded-full w-fit text-brand-soft text-sm">
          <ArrowUpRightIcon size={16} />
          Viewing projects using {selectedTech}
        </div>
      )}
    </section>
  );
}
