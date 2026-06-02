import { Heading } from "@/components/common";
import { educationItems } from "@/components/public/sections/about/data";
import { aboutInteractiveGlowCardClassName } from "@/components/public/sections/about/styles";
import { cn } from "@/lib/utils";

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
      <div className="grid gap-4">
        {educationItems.map((institution) => (
          <article
            key={institution.name}
            className={cn(aboutInteractiveGlowCardClassName, "rounded-3xl p-5")}
          >
            <h3 className="font-heading text-xl font-semibold text-foreground">
              {institution.name}
            </h3>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              {institution.description}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
