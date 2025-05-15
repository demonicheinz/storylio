import { Heading } from "@/components/ui";
import { about } from "@/data";

export function ExperienceSection() {
  return (
    <div>
      <Heading
        level="h2"
        variant="section"
        size="lg"
        title="Work"
        highlight="Experience"
      />
      <div className="space-y-12">
        {about.work.experiences.map((experience, index) => (
          <div
            key={`${experience.company}-${index}`}
            className="space-y-4"
          >
            <div className="flex flex-row flex-wrap justify-between items-baseline gap-2 mb-1">
              <h3
                id={experience.company}
                className="font-bold text-[20px] sm:text-2xl md:text-2xl"
              >
                {experience.company}
              </h3>
              <span className="text-muted-foreground md:text-md text-sm whitespace-nowrap">
                {experience.timeframe}
              </span>
            </div>

            <p className="mb-4 text-purple text-sm">{experience.role}</p>

            <ul className="space-y-4 ml-5 [&>li::marker]:text-purple list-disc">
              {experience.achievements.map((achievement, i) => (
                <li
                  key={`${experience.company}-achievement-${i}`}
                  className="text-base"
                >
                  {achievement}
                </li>
              ))}
            </ul>

            {experience.images && experience.images.length > 0 && (
              <div className="flex flex-wrap gap-4 pt-4 pl-5">
                {experience.images.map((image, i) => (
                  <div
                    key={`${experience.company}-image-${i}`}
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
