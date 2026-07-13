import {
  ArticleIcon,
  ChatCircleIcon,
  EyeIcon,
  FolderOpenIcon,
  ImageIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { connection } from "next/server";
import type { ComponentType } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAboutContent } from "@/features/about/data";
import { AboutContentForm } from "@/features/dashboard/about/components/content-form";
import { AboutStructuredManager } from "@/features/dashboard/about/components/structured-manager";
import { dashboardStyles } from "@/features/dashboard/shared/styles";
import { getActionSession } from "@/lib/auth-session";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";

type StatCardProps = {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number;
  description: string;
  iconClassName: string;
};

function AboutStatCard({
  icon: Icon,
  label,
  value,
  description,
  iconClassName,
}: StatCardProps) {
  return (
    <Card className={dashboardStyles.statCard}>
      <CardContent className={dashboardStyles.statContent}>
        <div className={cn(dashboardStyles.statIcon, iconClassName)}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="font-heading font-bold text-xl">{value}</p>
          <p className="text-[11px] text-muted-foreground">{label}</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground/80">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function DashboardAboutPage() {
  await connection();
  await getActionSession();

  const [aboutContent, experiences, education, categories] = await Promise.all([
    getAboutContent(),
    db.workExperience.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    }),
    db.education.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    }),
    db.skillCategory.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      include: {
        skills: { orderBy: [{ order: "asc" }, { createdAt: "asc" }] },
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
          <h1 className="font-heading font-bold text-3xl">About</h1>
          <p className="mt-2 text-muted-foreground">
            Manage bilingual About content and its structured public sections.
          </p>
        </div>
        <Button asChild variant="outline" className="rounded-2xl">
          <Link href="/about" target="_blank">
            <EyeIcon data-icon="inline-start" />
            Preview About Page
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="content" className="flex flex-col gap-5 min-w-0">
        <div className={dashboardStyles.statGrid}>
          <AboutStatCard
            icon={ArticleIcon}
            label="Content"
            value={aboutContent ? 1 : 0}
            description="About record"
            iconClassName="bg-sky-500/12 text-sky-300"
          />
          <AboutStatCard
            icon={FolderOpenIcon}
            label="Experience"
            value={experiences.length}
            description="Work entries"
            iconClassName="bg-emerald-500/12 text-emerald-300"
          />
          <AboutStatCard
            icon={ImageIcon}
            label="Education"
            value={education.length}
            description="History entries"
            iconClassName="bg-violet-500/12 text-violet-300"
          />
          <AboutStatCard
            icon={ChatCircleIcon}
            label="Skills"
            value={skillsCount}
            description={`${visibleSkillsCount} of ${skillsCount} visible`}
            iconClassName="bg-amber-500/12 text-amber-300"
          />
        </div>

        <TabsList className="content-center grid grid-cols-4 bg-card/55 p-1.5 border border-border/60 rounded-2xl w-full xl:w-fit min-w-0 xl:min-w-lg h-auto min-h-12">
          <TabsTrigger
            value="content"
            className="px-2 sm:px-3 py-2.5 rounded-xl min-w-0 min-h-9 text-xs sm:text-sm leading-none"
          >
            Content
          </TabsTrigger>
          <TabsTrigger
            value="experience"
            className="px-2 sm:px-3 py-2.5 rounded-xl min-w-0 min-h-9 text-xs sm:text-sm leading-none"
          >
            Experience
          </TabsTrigger>
          <TabsTrigger
            value="education"
            className="px-2 sm:px-3 py-2.5 rounded-xl min-w-0 min-h-9 text-xs sm:text-sm leading-none"
          >
            Education
          </TabsTrigger>
          <TabsTrigger
            value="skills"
            className="px-2 sm:px-3 py-2.5 rounded-xl min-w-0 min-h-9 text-xs sm:text-sm leading-none"
          >
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
