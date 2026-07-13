import { Heading } from "@/components/common";
import { educationItems } from "@/components/public/sections/about/data";
import { aboutInteractiveGlowCardClassName } from "@/components/public/sections/about/styles";
import { cn } from "@/lib/utils";

type PublicEducation = {
  id: string;
  institution: string;
  detail: string;
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
        description: null,
      }));
  return (
    <div>
      <Heading
        level="h2"
        variant="section"
        size="lg"
        title={language === "id" ? "Riwayat" : "Education"}
        highlight={language === "id" ? "Pendidikan" : "History"}
      />
      <div className="gap-4 grid">
        {items.map((institution) => (
          <article
            key={institution.id}
            className={cn(aboutInteractiveGlowCardClassName, "rounded-3xl p-5")}
          >
            <h3 className="font-heading font-semibold text-foreground text-xl">
              {institution.institution}
            </h3>
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
