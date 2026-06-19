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
          <p className="font-heading text-xl font-bold">{value}</p>
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
          <h1 className="font-heading text-3xl font-bold">About</h1>
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

      <Tabs defaultValue="content" className="flex min-w-0 flex-col gap-5">
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

        <TabsList className="grid h-auto min-h-12 w-full min-w-0 grid-cols-4 content-center rounded-2xl border border-border/60 bg-card/55 p-1.5 xl:w-fit xl:min-w-lg">
          <TabsTrigger
            value="content"
            className="min-h-9 min-w-0 rounded-xl px-2 py-2.5 text-xs leading-none sm:px-3 sm:text-sm"
          >
            Content
          </TabsTrigger>
          <TabsTrigger
            value="experience"
            className="min-h-9 min-w-0 rounded-xl px-2 py-2.5 text-xs leading-none sm:px-3 sm:text-sm"
          >
            Experience
          </TabsTrigger>
          <TabsTrigger
            value="education"
            className="min-h-9 min-w-0 rounded-xl px-2 py-2.5 text-xs leading-none sm:px-3 sm:text-sm"
          >
            Education
          </TabsTrigger>
          <TabsTrigger
            value="skills"
            className="min-h-9 min-w-0 rounded-xl px-2 py-2.5 text-xs leading-none sm:px-3 sm:text-sm"
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
