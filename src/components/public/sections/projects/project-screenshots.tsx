import { ProjectCover } from "@/components/public/sections/projects/project-cover";

type ProjectScreenshotsProps = {
  screenshots: string[];
  title: string;
};

export function ProjectScreenshots({
  screenshots,
  title,
}: ProjectScreenshotsProps) {
  if (screenshots.length === 0) {
    return null;
  }

  return (
    <section className="mt-14">
      <div className="mb-6 flex flex-col gap-2">
        <p className="text-xs font-semibold tracking-[0.28em] text-brand-soft uppercase">
          Screenshots
        </p>
        <h2 className="font-heading text-3xl font-semibold text-foreground">
          Interface details
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {screenshots.map((screenshot, index) => (
          <ProjectCover
            key={screenshot}
            src={screenshot}
            alt={`${title} screenshot ${index + 1}`}
            className="aspect-[16/10] rounded-3xl shadow-[0_0_48px_rgba(139,92,246,0.08)]"
          />
        ))}
      </div>
    </section>
  );
}
