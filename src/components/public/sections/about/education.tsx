import { Heading } from "@/components/common/heading";
import { educationItems } from "@/components/public/sections/about/data";
import styles from "./about.module.css";

type PublicEducation = {
  id: string;
  institution: string;
  detail: string;
  period?: string;
  description: string | null;
};
export function EducationSection({
  education,
  language = "en",
}: {
  education?: PublicEducation[];
  language?: "en" | "id";
}) {
  const items = education?.length
    ? education
    : educationItems.map((item) => ({
        id: item.name,
        institution: item.name,
        detail: item.description,
        period: "",
        description: null,
      }));
  return (
    <div>
      <Heading
        level="h2"
        variant="section"
        size="lg"
        title={language === "id" ? "Pendidikan &" : "Education &"}
        highlight={language === "id" ? "Pembelajaran" : "Learning"}
      />
      <div>
        {items.map((institution) => (
          <article key={institution.id} className={styles.educationItem}>
            {institution.period && (
              <p className={styles.period}>{institution.period}</p>
            )}
            <h3>{institution.institution}</h3>
            <p className="mt-2 text-muted-foreground text-sm leading-7">
              {institution.detail}
            </p>
            {institution.description && (
              <p className="mt-2 text-muted-foreground text-sm leading-7">
                {institution.description}
              </p>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
