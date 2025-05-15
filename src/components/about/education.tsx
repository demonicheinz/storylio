import { Heading } from "@/components/ui";
import { about } from "@/data";

export function EducationSection() {
  return (
    <div>
      <Heading
        level="h2"
        variant="section"
        size="lg"
        title="Education"
        highlight="History"
      />
      <div className="space-y-8">
        {about.education.institutions.map((institution, index) => (
          <div
            key={`${institution.name}-${index}`}
            className="space-y-1"
          >
            <h3
              id={institution.name}
              className="font-bold text-[20px] sm:text-2xl md:text-2xl"
            >
              {institution.name}
            </h3>
            <p className="text-muted-foreground text-sm">{institution.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
