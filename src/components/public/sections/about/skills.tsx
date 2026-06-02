import { Heading } from "@/components/common";
import { skillGroups } from "@/components/public/sections/about/data";
import { aboutInteractiveGlowCardClassName } from "@/components/public/sections/about/styles";
import { cn } from "@/lib/utils";

export function SkillsSection() {
  return (
    <div>
      <Heading
        level="h2"
        variant="section"
        size="lg"
        title="Technical"
        highlight="Skills"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {skillGroups.map((skill) => (
          <article
            key={skill.title}
            className={cn(aboutInteractiveGlowCardClassName, "rounded-3xl p-5")}
          >
            <h3 className="font-heading text-xl font-semibold text-foreground">
              {skill.title}
            </h3>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              {skill.description}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
