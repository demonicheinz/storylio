import { connection } from "next/server";
import { getAboutContent } from "@/features/about/data";
import { AboutContentForm } from "@/features/dashboard/about/components/content-form";
import { AboutStructuredManager } from "@/features/dashboard/about/components/structured-manager";
import { getActionSession } from "@/lib/auth-session";
import { db } from "@/lib/db";

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

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-heading text-3xl font-bold">About</h1>
        <p className="mt-2 text-muted-foreground">
          Manage bilingual About content and its structured public sections.
        </p>
      </div>

      <AboutContentForm content={aboutContent ?? undefined} />
      <AboutStructuredManager data={{ experiences, education, categories }} />
    </div>
  );
}
