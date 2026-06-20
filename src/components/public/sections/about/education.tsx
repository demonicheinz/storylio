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
      <div className="grid gap-4">
        {items.map((institution) => (
          <article
            key={institution.id}
            className={cn(aboutInteractiveGlowCardClassName, "rounded-3xl p-5")}
          >
            <h3 className="font-heading text-xl font-semibold text-foreground">
              {institution.institution}
            </h3>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              {institution.detail}
            </p>
            {institution.description && (
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                {institution.description}
              </p>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
