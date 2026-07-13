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
  language = "en",
}: {
  experiences?: PublicExperience[];
  language?: "en" | "id";
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
        title={language === "id" ? "Pengalaman" : "Work"}
        highlight={language === "id" ? "Kerja" : "Experience"}
      />
      <div className="before:top-2 before:bottom-2 before:left-1 before:absolute relative flex flex-col gap-10 before:bg-border/70 before:w-px">
        {items.map((experience) => (
          <article key={experience.id} className="relative pl-8">
            <span className="top-2 left-0 absolute bg-brand-soft shadow-[0_0_24px_rgba(168,85,247,0.7)] rounded-full size-2.5" />
            <div className="flex flex-row flex-wrap justify-between items-baseline gap-2 mb-3">
              <h3 className="font-heading font-semibold text-foreground text-xl sm:text-2xl">
                {experience.company ?? experience.title}
              </h3>
              <span className="text-muted-foreground text-sm">
                {[
                  experience.startDate,
                  experience.isCurrent
                    ? language === "id"
                      ? "Sekarang"
                      : "Present"
                    : experience.endDate,
                ]
                  .filter(Boolean)
                  .join(" - ")}
              </span>
            </div>

            <p className="mb-4 font-medium text-brand-soft text-sm">
              {[experience.title, experience.type, experience.location]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {experience.description && (
              <p className="mb-4 text-muted-foreground text-base leading-7">
                {experience.description}
              </p>
            )}

            {experience.highlights.length > 0 && (
              <ul className="flex flex-col gap-3 ml-5 marker:text-brand-soft list-disc">
                {experience.highlights.map((achievement) => (
                  <li
                    key={achievement}
                    className="text-muted-foreground text-base"
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
