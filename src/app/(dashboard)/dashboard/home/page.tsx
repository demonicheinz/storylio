import { asc, desc } from "drizzle-orm";
import { connection } from "next/server";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { HomeContentManager } from "@/features/dashboard/home/components/home-section-form";
import { db } from "@/lib/db";
import { HomeSectionType } from "@/lib/db/enums";
import { HOME_HERO_ID } from "@/lib/home-hero";

async function getHomeSections() {
  return db.query.homeSection.findMany({
    orderBy: (table) => [asc(table.order), desc(table.createdAt)],
    columns: {
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

async function getTestimonials() {
  return db.query.testimonial.findMany({
    orderBy: (table) => [asc(table.order), desc(table.createdAt)],
    columns: {
      id: true,
      name: true,
      role: true,
      company: true,
      avatar: true,
      content: true,
      isVisible: true,
      order: true,
      createdAt: true,
    },
  });
}

export default function HomeManagePage() {
  return (
    <div className="flex flex-col gap-5 min-w-0">
      <div className="flex justify-between items-start gap-4">
        <div className="min-w-0">
          <h1 className="font-heading font-semibold text-3xl">Home</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground text-sm leading-6">
            Edit the Hero, Approach, and Tech stack on the public Home page.
          </p>
        </div>
      </div>

      <Suspense fallback={<HomeContentSkeleton />}>
        <HomeManageContent />
      </Suspense>
    </div>
  );
}

function HomeContentSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading Home content"
      aria-busy="true"
      className="flex flex-col gap-5"
    >
      <span className="sr-only">Loading Home content...</span>
      <div aria-hidden="true" className="flex gap-2">
        {["hero", "phases", "logos", "legacy"].map((tab) => (
          <Skeleton key={tab} className="w-28 h-9 motion-reduce:animate-none" />
        ))}
      </div>
      <div aria-hidden="true" className="flex flex-col gap-3">
        {["first", "second", "third"].map((card) => (
          <Skeleton
            key={card}
            className="w-full h-28 motion-reduce:animate-none"
          />
        ))}
      </div>
    </div>
  );
}

async function HomeManageContent() {
  await connection();

  const [sections, testimonials] = await Promise.all([
    getHomeSections(),
    getTestimonials(),
  ]);
  const phases = sections.filter(
    (section) => section.type === HomeSectionType.PHASE,
  );
  const logos = sections.filter(
    (section) => section.type === HomeSectionType.LOGO,
  );
  const headline =
    sections.find((section) => section.id === HOME_HERO_ID)?.label ?? "";

  return (
    <HomeContentManager
      headline={headline}
      phases={phases.map((section) => ({
        ...section,
        type: "PHASE",
        createdAt: section.createdAt.toISOString(),
      }))}
      testimonials={testimonials.map((testimonial) => ({
        ...testimonial,
        createdAt: testimonial.createdAt.toISOString(),
      }))}
      logos={logos.map((section) => ({
        ...section,
        type: "LOGO",
        createdAt: section.createdAt.toISOString(),
      }))}
    />
  );
}
