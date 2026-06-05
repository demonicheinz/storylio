import { Heading } from "@/components/common";
import { skillGroups } from "@/components/public/sections/about/data";
import { aboutInteractiveGlowCardClassName } from "@/components/public/sections/about/styles";
import { cn } from "@/lib/utils";

type PublicSkillCategory = {
  id: string;
  name: string;
  description: string | null;
  skills: Array<{ id: string; name: string; level: string | null }>;
};
export function SkillsSection({
  categories,
}: {
  categories?: PublicSkillCategory[];
}) {
  const items = categories?.length
    ? categories
    : skillGroups.map((item) => ({
        id: item.title,
        name: item.title,
        description: item.description,
        skills: [],
      }));
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
        {items.map((skill) => (
          <article
            key={skill.id}
            className={cn(aboutInteractiveGlowCardClassName, "rounded-3xl p-5")}
          >
            <h3 className="font-heading text-xl font-semibold text-foreground">
              {skill.name}
            </h3>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              {skill.description}
            </p>
            {skill.skills.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {skill.skills.map((item) => (
                  <span
                    key={item.id}
                    className="rounded-full border border-border/50 bg-background/30 px-3 py-1 text-xs text-muted-foreground"
                  >
                    {item.name}
                    {item.level ? ` · ${item.level}` : ""}
                  </span>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
