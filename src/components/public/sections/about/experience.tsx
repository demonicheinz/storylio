import { Heading } from "@/components/common";
import { workExperiences } from "@/components/public/sections/about/data";

export function ExperienceSection() {
  return (
    <div>
      <Heading
        level="h2"
        variant="section"
        size="lg"
        title="Work"
        highlight="Experience"
      />
      <div className="relative flex flex-col gap-10 before:absolute before:top-2 before:bottom-2 before:left-1 before:w-px before:bg-border/70">
        {workExperiences.map((experience) => (
          <article key={experience.company} className="relative pl-8">
            <span className="absolute top-2 left-0 size-2.5 rounded-full bg-brand-soft shadow-[0_0_24px_rgba(168,85,247,0.7)]" />
            <div className="mb-3 flex flex-row flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-heading text-xl font-semibold text-foreground sm:text-2xl">
                {experience.company}
              </h3>
              <span className="text-sm text-muted-foreground">
                {experience.timeframe}
              </span>
            </div>

            <p className="mb-4 text-sm font-medium text-brand-soft">
              {experience.role}
            </p>

            <ul className="ml-5 flex list-disc flex-col gap-3 marker:text-brand-soft">
              {experience.achievements.map((achievement) => (
                <li
                  key={achievement}
                  className="text-base text-muted-foreground"
                >
                  {achievement}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}
