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
  language = "en",
}: {
  categories?: PublicSkillCategory[];
  language?: "en" | "id";
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
        title={language === "id" ? "Keahlian" : "Technical"}
        highlight={language === "id" ? "Teknis" : "Skills"}
      />
      <div className="gap-4 grid sm:grid-cols-2">
        {items.map((skill) => (
          <article
            key={skill.id}
            className={cn(aboutInteractiveGlowCardClassName, "rounded-3xl p-5")}
          >
            <h3 className="font-heading font-semibold text-foreground text-xl">
              {skill.name}
            </h3>
            <p className="mt-3 text-muted-foreground text-sm leading-7">
              {skill.description}
            </p>
            {skill.skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {skill.skills.map((item) => (
                  <span
                    key={item.id}
                    className="bg-background/30 px-3 py-1 border border-border/50 rounded-full text-muted-foreground text-xs"
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
