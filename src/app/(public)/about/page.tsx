import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import { PublicBackground } from "@/components/common";
import {
  aboutGlowCardClassName,
  BioSection,
  EducationSection,
  ExperienceSection,
  ProfileSection,
  SideNavigation,
  SkillsSection,
} from "@/components/public/sections/about";
import AboutContent from "@/content/about.mdx";
import { cn } from "@/lib/utils";

const sectionSpacing = "mt-16 scroll-mt-28 md:mt-24";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "About Heinz",
    description:
      "Background, experience, education, and technical skills of Ahmad Haizul Amany.",
    openGraph: {
      title: "About Heinz",
      description:
        "Learn about Heinz's background, work experience, education, and technical skills.",
      type: "profile",
      images: ["/og?title=About%20Heinz&type=page"],
    },
    twitter: {
      card: "summary_large_image",
      title: "About Heinz",
      description:
        "Background, experience, education, and technical skills of Ahmad Haizul Amany.",
      images: ["/og?title=About%20Heinz&type=page"],
    },
  };
}

export default async function AboutPage() {
  "use cache";
  cacheLife("hours");

  return (
    <main className="min-h-screen">
      <PublicBackground variant="about" />

      <div className="flex min-h-screen flex-col justify-center xl:flex-row">
        <div className="fixed left-0 hidden h-screen flex-col items-center justify-center xl:flex">
          <SideNavigation />
        </div>

        <div className="relative mx-auto flex w-full max-w-[1056px] min-w-0 flex-col justify-center px-4 pt-32 sm:px-6 lg:px-8">
          <div className="flex w-full flex-col md:flex-row">
            <div className="flex w-full flex-col items-center gap-4 pb-8 md:hidden">
              <ProfileSection isMobile />
            </div>

            <div className="z-10 hidden shrink-0 md:sticky md:top-28 md:flex md:w-[280px] md:self-start lg:w-[320px]">
              <ProfileSection />
            </div>

            <div className="relative flex w-full max-w-full flex-col md:max-w-[calc(100%-280px)] md:pl-8 lg:max-w-[calc(100%-320px)] lg:pl-10 xl:max-w-[42rem]">
              <section id="introduction" className="scroll-mt-28">
                <BioSection />
              </section>

              <section id="story" className={sectionSpacing}>
                <div
                  className={cn(
                    aboutGlowCardClassName,
                    "flex flex-col gap-6 rounded-3xl p-6 md:p-8",
                  )}
                >
                  <AboutContent />
                </div>
              </section>

              {[
                {
                  id: "work-experience",
                  component: <ExperienceSection />,
                },
                {
                  id: "education-history",
                  component: <EducationSection />,
                },
                {
                  id: "technical-skills",
                  component: <SkillsSection />,
                },
              ].map((section) => (
                <section
                  key={section.id}
                  id={section.id}
                  className={cn(sectionSpacing, "last:mb-16")}
                >
                  {section.component}
                </section>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="h-32" />
    </main>
  );
}
