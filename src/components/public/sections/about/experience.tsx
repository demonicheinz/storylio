import { Heading } from "@/components/common/heading";
import { workExperiences } from "@/components/public/sections/about/data";
import styles from "./about.module.css";

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
      <div className={styles.timeline}>
        {items.map((experience) => (
          <article
            key={experience.id}
            className={styles.timelineItem}
            data-current={experience.isCurrent}
          >
            <p className={styles.period}>
              {[
                experience.startDate,
                experience.isCurrent
                  ? language === "id"
                    ? "Sekarang"
                    : "Present"
                  : experience.endDate,
              ]
                .filter(Boolean)
                .join(" – ")}
            </p>
            <h3>{experience.company ?? experience.title}</h3>

            <p className={styles.timelineRole}>
              {[experience.title, experience.type, experience.location]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {experience.description && (
              <p className={styles.timelineDescription}>
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
