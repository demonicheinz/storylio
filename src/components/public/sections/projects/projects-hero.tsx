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
    <section className="flex flex-col gap-8 pt-32 pb-10 md:pt-40 md:pb-14">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="mb-4 text-xs font-semibold tracking-[0.32em] text-brand-soft uppercase">
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
          <p className="max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
            A focused archive of shipped interfaces, full-stack builds, and web
            experiments. Each project is selected for the decisions behind it:
            performance, clarity, and the little interaction details that make a
            product feel finished.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:w-72">
          <div className="rounded-3xl border border-border/40 bg-surface/65 p-4 shadow-[0_0_48px_rgba(139,92,246,0.08)] backdrop-blur-xl">
            <p className="text-3xl font-bold text-foreground">
              {totalProjects}
            </p>
            <p className="mt-1 text-xs tracking-widest text-muted-foreground uppercase">
              Published
            </p>
          </div>
          <div className="rounded-3xl border border-border/40 bg-surface/65 p-4 shadow-[0_0_48px_rgba(139,92,246,0.08)] backdrop-blur-xl">
            <p className="text-3xl font-bold text-foreground">{totalTech}</p>
            <p className="mt-1 text-xs tracking-widest text-muted-foreground uppercase">
              Stacks
            </p>
          </div>
        </div>
      </div>

      {selectedTech && (
        <div className="flex w-fit items-center gap-2 rounded-full border border-brand-soft/30 bg-brand-soft/10 px-4 py-2 text-sm text-brand-soft">
          <ArrowUpRightIcon size={16} />
          Viewing projects using {selectedTech}
        </div>
      )}
    </section>
  );
}
