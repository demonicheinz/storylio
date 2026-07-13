import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr";

type EmptyProjectsProps = {
  selectedTech?: string;
};

export function EmptyProjects({ selectedTech }: EmptyProjectsProps) {
  return (
    <div className="flex flex-col justify-center items-center bg-surface/45 shadow-[0_0_48px_rgba(139,92,246,0.08)] backdrop-blur-xl p-8 border border-border/60 border-dashed rounded-3xl min-h-80 text-center">
      <div className="flex justify-center items-center bg-brand-soft/10 mb-5 border border-brand-soft/35 rounded-full size-14 text-brand-soft">
        <MagnifyingGlassIcon size={24} />
      </div>
      <h2 className="font-heading font-semibold text-foreground text-2xl">
        No projects found
      </h2>
      <p className="mt-3 max-w-md text-muted-foreground text-sm leading-7">
        {selectedTech
          ? `There are no published projects using ${selectedTech} yet. Try another stack or reset the filter.`
          : "Published projects will appear here once they are available from the CMS."}
      </p>
    </div>
  );
}
