import { connection } from "next/server";
import { HomeContentManager } from "@/features/dashboard/home/components/home-section-form";
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

async function getTestimonials() {
  return db.testimonial.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    select: {
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

export default async function HomeManagePage() {
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

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-heading text-3xl font-bold">Home</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Manage Home page approach phases, client or technology logos, and
            testimonials.
          </p>
        </div>
      </div>

      <HomeContentManager
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
    </div>
  );
}
