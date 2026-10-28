import { EyeIcon } from "@phosphor-icons/react/dist/ssr";
import { asc } from "drizzle-orm";
import Link from "next/link";
import { connection } from "next/server";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAboutContentUncached } from "@/features/about/data";
import { AboutContentForm } from "@/features/dashboard/about/components/content-form";
import { AboutStructuredManager } from "@/features/dashboard/about/components/structured-manager";
import { DashboardRouteBoundary } from "@/features/dashboard/shared/components/route-boundary";
import { DashboardSummary } from "@/features/dashboard/shared/components/summary";
import { dashboardStyles } from "@/features/dashboard/shared/styles";
import { getActionSession } from "@/lib/auth-session";
import { db } from "@/lib/db";

export default function DashboardAboutPage() {
  return (
    <DashboardRouteBoundary title="About">
      <DashboardAboutContent />
    </DashboardRouteBoundary>
  );
}

async function DashboardAboutContent() {
  await connection();
  await getActionSession();

  const [aboutContent, experiences, education, categories] = await Promise.all([
    getAboutContentUncached(),
    db.query.workExperience
      .findMany({
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
      orderBy: (table) => [asc(table.order), asc(table.createdAt)],
    }),
    db.query.skillCategory.findMany({
      orderBy: (table) => [asc(table.order), asc(table.createdAt)],
      with: {
        skills: {
          orderBy: (table) => [asc(table.order), asc(table.createdAt)],
        },
      },
    }),
  ]);

  const structuredData = { experiences, education, categories };
  const skillsCount = categories.reduce(
    (total, category) => total + category.skills.length,
    0,
  );
  const visibleSkillsCount = categories.reduce(
    (total, category) =>
      total + category.skills.filter((skill) => skill.isVisible).length,
    0,
  );

  return (
    <div className={dashboardStyles.page}>
      <div className={dashboardStyles.header}>
        <div className="min-w-0">
          <h1 className="font-heading font-semibold text-3xl">About</h1>
          <p className="mt-2 text-muted-foreground">
            Manage bilingual About content and its structured public sections.
          </p>
        </div>
        <Button
          role="link"
          render={<Link href="/about" target="_blank" />}
          nativeButton={false}
          variant="outline"
        >
          <EyeIcon data-icon="inline-start" />
          Preview About Page
        </Button>
      </div>

      <Tabs defaultValue="content" className="flex flex-col gap-5 min-w-0">
        <DashboardSummary
          items={[
            { label: "Work entries", value: experiences.length },
            { label: "Education entries", value: education.length },
            {
              label: "Skills visible",
              value: `${visibleSkillsCount} of ${skillsCount}`,
            },
          ]}
        />

        <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full sm:w-fit h-auto">
          <TabsTrigger value="content" className="min-w-0 text-xs sm:text-sm">
            Content
          </TabsTrigger>
          <TabsTrigger
            value="experience"
            className="min-w-0 text-xs sm:text-sm"
          >
            Experience
          </TabsTrigger>
          <TabsTrigger value="education" className="min-w-0 text-xs sm:text-sm">
            Education
          </TabsTrigger>
          <TabsTrigger value="skills" className="min-w-0 text-xs sm:text-sm">
            Skills
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content">
          <AboutContentForm content={aboutContent ?? undefined} />
        </TabsContent>
        <TabsContent value="experience">
          <AboutStructuredManager data={structuredData} section="experience" />
        </TabsContent>
        <TabsContent value="education">
          <AboutStructuredManager data={structuredData} section="education" />
        </TabsContent>
        <TabsContent value="skills">
          <AboutStructuredManager data={structuredData} section="skills" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
