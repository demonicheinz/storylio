import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import { Heading, MotionReveal, PublicBackground } from "@/components/common";
import {
  AboutSideNavigation,
  BioSection,
  EducationSection,
  ExperienceSection,
  ProfileSection,
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

export const unstable_instant = {
  prefetch: "runtime",
  samples: [{ searchParams: { lang: null } }],
};

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
      publicEmail: true,
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

async function getStructuredAboutData() {
  "use cache";
  cacheLife("hours");

  const [experiences, education, categories] = await Promise.all([
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

  return { categories, education, experiences };
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
  "use cache";
  cacheLife("hours");

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
  const [profile, aboutContent, structuredData] = await Promise.all([
    getAboutProfile(),
    getAboutContent(),
    getStructuredAboutData(),
  ]);
  const { categories, education, experiences } = structuredData;
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
  const workingPrinciples =
    language === "id"
      ? {
          howIWork: {
            title: "Cara Saya",
            highlight: "Bekerja",
          },
          whatIValue: {
            title: "Hal yang Saya",
            highlight: "Hargai",
          },
        }
      : {
          howIWork: {
            title: "How I",
            highlight: "Work",
          },
          whatIValue: {
            title: "What I",
            highlight: "Value",
          },
        };

  return (
    <main className="min-h-screen">
      <PublicBackground variant="about" />

      <div className="flex xl:flex-row flex-col justify-center min-h-screen">
        <div className="hidden left-0 fixed xl:flex flex-col justify-center items-center h-screen">
          <AboutSideNavigation language={language} />
        </div>

        <div className="relative flex flex-col justify-center mx-auto px-4 sm:px-6 lg:px-8 pt-38 md:pt-40 w-full min-w-0 max-w-264">
          <div className="flex md:flex-row flex-col w-full">
            <div className="md:hidden flex flex-col items-center gap-4 pb-8 w-full">
              <ProfileSection isMobile profile={publicProfile} />
            </div>

            <div className="hidden md:top-28 z-10 md:sticky md:flex md:self-start md:w-70 lg:w-[320px] shrink-0">
              <ProfileSection profile={publicProfile} />
            </div>

            <div className="relative flex flex-col md:pl-8 lg:pl-10 w-full max-w-full md:max-w-[calc(100%-280px)] lg:max-w-[calc(100%-320px)] xl:max-w-2xl">
              <MotionReveal>
                <section id="introduction" className="scroll-mt-28">
                  <BioSection
                    profile={publicProfile}
                    intro={intro}
                    language={language}
                  />
                </section>
              </MotionReveal>

              <MotionReveal className={sectionSpacing}>
                <section id="working-principles" className="scroll-mt-28">
                  <div className="flex flex-col gap-10 md:gap-12">
                    <div className="min-w-0">
                      <Heading
                        level="h2"
                        variant="section"
                        size="lg"
                        title={workingPrinciples.howIWork.title}
                        highlight={workingPrinciples.howIWork.highlight}
                      />
                      <div className="pl-5 sm:pl-7 border-border/40 border-l">
                        <div className={aboutMdxClassName}>
                          {howIWorkContent}
                        </div>
                      </div>
                    </div>

                    <div className="pt-10 md:pt-12 border-border/30 border-t min-w-0">
                      <Heading
                        level="h2"
                        variant="section"
                        size="lg"
                        title={workingPrinciples.whatIValue.title}
                        highlight={workingPrinciples.whatIValue.highlight}
                      />
                      <div className="pl-5 sm:pl-7 border-border/40 border-l">
                        <div className={aboutMdxClassName}>
                          {whatIValueContent}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </MotionReveal>

              {[
                {
                  id: "work-experience",
                  component: (
                    <ExperienceSection
                      language={language}
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
                      language={language}
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
                      language={language}
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
                <MotionReveal
                  key={section.id}
                  className={cn(sectionSpacing, "last:mb-16")}
                >
                  <section id={section.id} className="scroll-mt-28">
                    {section.component}
                  </section>
                </MotionReveal>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="h-32" />
    </main>
  );
}
