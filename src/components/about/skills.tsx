import { Heading } from "@/components/ui";
import { about } from "@/data";

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
      <div className="space-y-8">
        {about.technical.skills.map((skill, index) => (
          <div
            key={`${skill.title}-${index}`}
            className="space-y-2"
          >
            <h3 className="font-bold text-[20px] sm:text-2xl md:text-2xl">{skill.title}</h3>
            <p className="text-muted-foreground text-base">{skill.description}</p>

            {skill.images && skill.images.length > 0 && (
              <div className="flex flex-wrap gap-3 pt-4">
                {skill.images.map((image, i) => (
                  <div
                    key={`${skill.title}-image-${i}`}
                    className="border rounded-2xl overflow-hidden"
                  >
                    <img
                      src={image.src}
                      alt={image.alt || ""}
                      width={image.width}
                      height={image.height}
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
