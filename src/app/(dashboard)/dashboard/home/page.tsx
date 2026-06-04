import { connection } from "next/server";
import { HomeContentManager } from "@/components/dashboard/home-section-form";
import { HomeSectionType } from "@/generated/prisma";
import { db } from "@/lib/db";

async function getHomeSections() {
  return db.homeSection.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      type: true,
      label: true,
      content: true,
      imageUrl: true,
      order: true,
      createdAt: true,
    },
  });
}

export default async function HomeManagePage() {
  await connection();

  const sections = await getHomeSections();
  const phases = sections.filter(
    (section) => section.type === HomeSectionType.PHASE,
  );
  const logos = sections.filter(
    (section) => section.type === HomeSectionType.LOGO,
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-3xl font-bold">Manage Home</h1>
        <p className="mt-2 text-muted-foreground">
          Manage Home page approach phases and client or technology logos.
        </p>
      </div>

      <HomeContentManager
        phases={phases.map((section) => ({
          ...section,
          type: "PHASE",
          createdAt: section.createdAt.toISOString(),
        }))}
        logos={logos.map((section) => ({
          ...section,
          type: "LOGO",
          createdAt: section.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
