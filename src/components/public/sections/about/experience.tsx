import { Heading } from "@/components/common";
import { workExperiences } from "@/components/public/sections/about/data";

type PublicExperience = {
  id: string;
  title: string;
  company: string | null;
  location: string | null;
  type: string | null;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  description: string | null;
  highlights: string[];
};

export function ExperienceSection({
  experiences,
}: {
  experiences?: PublicExperience[];
}) {
  const items = experiences?.length
    ? experiences
    : workExperiences.map((item) => ({
        id: item.company,
        title: item.role,
        company: item.company,
        location: null,
        type: null,
        startDate: item.timeframe,
        endDate: null,
        isCurrent: false,
        description: null,
        highlights: item.achievements,
      }));
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
        {items.map((experience) => (
          <article key={experience.id} className="relative pl-8">
            <span className="absolute top-2 left-0 size-2.5 rounded-full bg-brand-soft shadow-[0_0_24px_rgba(168,85,247,0.7)]" />
            <div className="mb-3 flex flex-row flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-heading text-xl font-semibold text-foreground sm:text-2xl">
                {experience.company ?? experience.title}
              </h3>
              <span className="text-sm text-muted-foreground">
                {[
                  experience.startDate,
                  experience.isCurrent ? "Present" : experience.endDate,
                ]
                  .filter(Boolean)
                  .join(" - ")}
              </span>
            </div>

            <p className="mb-4 text-sm font-medium text-brand-soft">
              {[experience.title, experience.type, experience.location]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {experience.description && (
              <p className="mb-4 text-base leading-7 text-muted-foreground">
                {experience.description}
              </p>
            )}

            {experience.highlights.length > 0 && (
              <ul className="ml-5 flex list-disc flex-col gap-3 marker:text-brand-soft">
                {experience.highlights.map((achievement) => (
                  <li
                    key={achievement}
                    className="text-base text-muted-foreground"
                  >
                    {achievement}
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
