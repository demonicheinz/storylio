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
import {
  aboutStoryFallback,
  introCopy,
} from "@/components/public/sections/about/data";
import type { AboutLanguage } from "@/components/public/sections/about/language-intro";
import { getAboutContent } from "@/features/about/data";
import { db } from "@/lib/db";
import { renderMDX } from "@/lib/mdx";
import { cn } from "@/lib/utils";

const sectionSpacing = "mt-16 scroll-mt-28 md:mt-24";
const aboutMdxClassName =
  "flex min-w-0 max-w-full flex-col gap-4 overflow-hidden [&_img]:h-auto [&_img]:max-w-full [&_pre]:max-w-full [&_table]:max-w-full";
const metadataFallback =
  "Background, experience, education, and technical skills of Ahmad Haizul Amany.";

function getMetadataDescription(value?: string | null) {
  const description = value?.replace(/\s+/g, " ").trim() || metadataFallback;

  return description.length > 160
    ? `${description.slice(0, 157).trimEnd()}...`
    : description;
}

export async function generateMetadata(): Promise<Metadata> {
  const aboutContent = await getAboutContent();
  const description = getMetadataDescription(aboutContent?.introEn);

  return {
    title: "About Heinz — Storylio",
    description,
    openGraph: {
      title: "About Heinz — Storylio",
      description,
      type: "profile",
      siteName: "Storylio",
      images: ["/og?title=About%20Heinz&type=page"],
    },
    twitter: {
      card: "summary_large_image",
      title: "About Heinz — Storylio",
      description,
      images: ["/og?title=About%20Heinz&type=page"],
    },
  };
}

async function getAboutProfile() {
  "use cache";
  cacheLife("hours");

  return db.user.findFirst({
    select: {
      name: true,
      email: true,
      image: true,
      tagline: true,
      bio: true,
      github: true,
      instagram: true,
      twitter: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

function getLanguage(
  value: string | string[] | undefined,
  defaultLanguage?: string,
): AboutLanguage {
  const selected = Array.isArray(value) ? value[0] : value;

  if (selected === "id" || selected === "en") {
    return selected;
  }

  return defaultLanguage === "id" ? "id" : "en";
}

function getLocalizedContent(
  language: AboutLanguage,
  english: string | null | undefined,
  indonesia: string | null | undefined,
  fallback: string,
) {
  const selected = language === "id" ? indonesia : english;
  const other = language === "id" ? english : indonesia;

  return selected?.trim() || other?.trim() || fallback;
}

function localizedOptional(
  language: AboutLanguage,
  english: string | null,
  indonesia: string | null,
) {
  return (
    (language === "id" ? indonesia : english)?.trim() ||
    (language === "id" ? english : indonesia)?.trim() ||
    null
  );
}

async function renderAboutMdx(source: string, fallback: string) {
  try {
    return await renderMDX(source);
  } catch (error) {
    console.error("Failed to render About CMS MDX:", error);
    return renderMDX(fallback);
  }
}

type AboutPageProps = {
  searchParams: Promise<{
    lang?: string | string[] | undefined;
  }>;
};

export default async function AboutPage({ searchParams }: AboutPageProps) {
  const [profile, aboutContent, experiences, education, categories] =
    await Promise.all([
      getAboutProfile(),
      getAboutContent(),
      db.workExperience.findMany({
        where: { isVisible: true },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      }),
      db.education.findMany({
        where: { isVisible: true },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      }),
      db.skillCategory.findMany({
        where: { isVisible: true, skills: { some: { isVisible: true } } },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        include: {
          skills: {
            where: { isVisible: true },
            orderBy: [{ order: "asc" }, { createdAt: "asc" }],
          },
        },
      }),
    ]);
  const language = getLanguage(
    (await searchParams).lang,
    aboutContent?.defaultLanguage,
  );
  const intro = getLocalizedContent(
    language,
    aboutContent?.introEn,
    aboutContent?.introId,
    introCopy[language],
  );
  const howIWork = getLocalizedContent(
    language,
    aboutContent?.howIWorkEn,
    aboutContent?.howIWorkId,
    aboutStoryFallback.howIWork,
  );
  const whatIValue = getLocalizedContent(
    language,
    aboutContent?.whatIValueEn,
    aboutContent?.whatIValueId,
    aboutStoryFallback.whatIValue,
  );
  const [howIWorkContent, whatIValueContent] = await Promise.all([
    renderAboutMdx(howIWork, aboutStoryFallback.howIWork),
    renderAboutMdx(whatIValue, aboutStoryFallback.whatIValue),
  ]);
  const publicProfile = profile ?? undefined;
  const storyTitles =
    language === "id"
      ? {
          howIWork: "Cara Saya Bekerja",
          whatIValue: "Hal yang Saya Hargai",
        }
      : {
          howIWork: "How I Work",
          whatIValue: "What I Value",
        };

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
              <ProfileSection isMobile profile={publicProfile} />
            </div>

            <div className="z-10 hidden shrink-0 md:sticky md:top-28 md:flex md:w-[280px] md:self-start lg:w-[320px]">
              <ProfileSection profile={publicProfile} />
            </div>

            <div className="relative flex w-full max-w-full flex-col md:max-w-[calc(100%-280px)] md:pl-8 lg:max-w-[calc(100%-320px)] lg:pl-10 xl:max-w-[42rem]">
              <section id="introduction" className="scroll-mt-28">
                <BioSection
                  profile={publicProfile}
                  intro={intro}
                  language={language}
                />
              </section>

              <section id="story" className={sectionSpacing}>
                <div
                  className={cn(
                    aboutGlowCardClassName,
                    "flex flex-col gap-6 rounded-3xl p-6 md:p-8",
                  )}
                >
                  <div className="flex min-w-0 flex-col gap-4">
                    <h2 className="font-heading text-3xl font-semibold text-foreground">
                      {storyTitles.howIWork}
                    </h2>
                    <div className={aboutMdxClassName}>{howIWorkContent}</div>
                  </div>

                  <div className="h-px bg-border/40" />

                  <div className="flex min-w-0 flex-col gap-4">
                    <h2 className="font-heading text-3xl font-semibold text-foreground">
                      {storyTitles.whatIValue}
                    </h2>
                    <div className={aboutMdxClassName}>{whatIValueContent}</div>
                  </div>
                </div>
              </section>

              {[
                {
                  id: "work-experience",
                  component: (
                    <ExperienceSection
                      experiences={experiences.map((item) => ({
                        ...item,
                        description: localizedOptional(
                          language,
                          item.descriptionEn,
                          item.descriptionId,
                        ),
                        highlights:
                          language === "id"
                            ? item.highlightsId.length
                              ? item.highlightsId
                              : item.highlightsEn
                            : item.highlightsEn.length
                              ? item.highlightsEn
                              : item.highlightsId,
                      }))}
                    />
                  ),
                },
                {
                  id: "education-history",
                  component: (
                    <EducationSection
                      education={education.map((item) => ({
                        id: item.id,
                        institution: item.institution,
                        detail: [
                          item.degree,
                          item.field,
                          item.location,
                          [item.startYear, item.endYear]
                            .filter(Boolean)
                            .join(" - "),
                        ]
                          .filter(Boolean)
                          .join(" · "),
                        description: localizedOptional(
                          language,
                          item.descriptionEn,
                          item.descriptionId,
                        ),
                      }))}
                    />
                  ),
                },
                {
                  id: "technical-skills",
                  component: (
                    <SkillsSection
                      categories={categories.map((item) => ({
                        id: item.id,
                        name: item.name,
                        description: localizedOptional(
                          language,
                          item.descriptionEn,
                          item.descriptionId,
                        ),
                        skills: item.skills.map((skill) => ({
                          id: skill.id,
                          name: skill.name,
                          level: skill.level,
                        })),
                      }))}
                    />
                  ),
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
