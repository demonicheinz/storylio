import { and, asc, eq, inArray } from "drizzle-orm";
import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { Heading } from "@/components/common/heading";
import { MotionReveal } from "@/components/common/motion";
import { PublicRouteBoundary } from "@/components/common/public-route-boundary";
import pageStyles from "@/components/public/public-page.module.css";
import aboutStyles from "@/components/public/sections/about/about.module.css";
import { AboutSideNavigation } from "@/components/public/sections/about/about-side-nav";
import { BioSection } from "@/components/public/sections/about/bio";
import {
  aboutStoryFallback,
  introCopy,
} from "@/components/public/sections/about/data";
import { EducationSection } from "@/components/public/sections/about/education";
import { ExperienceSection } from "@/components/public/sections/about/experience";
import type { AboutLanguage } from "@/components/public/sections/about/language-intro";
import { ProfileSection } from "@/components/public/sections/about/profile";
import { SkillsSection } from "@/components/public/sections/about/skills";
import { getAboutContent } from "@/features/about/data";
import { db } from "@/lib/db";
import { skill } from "@/lib/db/schema";
import { renderMDX } from "@/lib/mdx";
import { PUBLIC_CACHE_TAGS } from "@/lib/public-cache-tags";
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
  cacheTag(PUBLIC_CACHE_TAGS.profile);

  return db.query.user
    .findFirst({
      columns: {
        name: true,
        publicEmail: true,
        image: true,
        tagline: true,
        bio: true,
        github: true,
        instagram: true,
        twitter: true,
      },
      orderBy: (table) => [asc(table.createdAt)],
    })
    .then((row) => row ?? null);
}

async function getStructuredAboutData() {
  "use cache";
  cacheLife("hours");
  cacheTag(PUBLIC_CACHE_TAGS.about);

  const [experiences, education, categories] = await Promise.all([
    db.query.workExperience
      .findMany({
        where: (table) => eq(table.isVisible, true),
        orderBy: (table) => [asc(table.order), asc(table.createdAt)],
      })
      .then((rows) =>
        rows.map((row) => ({
          ...row,
          highlightsEn: row.highlightsEn ?? [],
          highlightsId: row.highlightsId ?? [],
        })),
      ),
    db.query.education.findMany({
      where: (table) => eq(table.isVisible, true),
      orderBy: (table) => [asc(table.order), asc(table.createdAt)],
    }),
    db.query.skillCategory.findMany({
      where: (table) =>
        and(
          eq(table.isVisible, true),
          inArray(
            table.id,
            db
              .select({ categoryId: skill.categoryId })
              .from(skill)
              .where(eq(skill.isVisible, true)),
          ),
        ),
      orderBy: (table) => [asc(table.order), asc(table.createdAt)],
      with: {
        skills: {
          where: (table) => eq(table.isVisible, true),
          orderBy: (table) => [asc(table.order), asc(table.createdAt)],
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
  cacheTag(PUBLIC_CACHE_TAGS.about);

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

export default function AboutPage(props: AboutPageProps) {
  return (
    <PublicRouteBoundary variant="about">
      <AboutContent {...props} />
    </PublicRouteBoundary>
  );
}

async function AboutContent({ searchParams }: AboutPageProps) {
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
    <main className={pageStyles.page} data-public-page="about">
      <div className={cn(pageStyles.container, aboutStyles.layout)}>
        <aside className={aboutStyles.sidebar}>
          <ProfileSection profile={publicProfile} />
          <AboutSideNavigation language={language} />
        </aside>
        <div className={aboutStyles.content}>
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
                  <div>
                    <div className={aboutMdxClassName}>{howIWorkContent}</div>
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
                  <div>
                    <div className={aboutMdxClassName}>{whatIValueContent}</div>
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
    </main>
  );
}
