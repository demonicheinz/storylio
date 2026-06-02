import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import { PublicBackground } from "@/components/common";
import {
  ApproachSection,
  ClientsSection,
  HeroSection,
  // RecentPostsSection,
  // RecentProjectsSection,
} from "@/components/public/sections/home";
import { db } from "@/lib/db";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Heinz - Full Stack Developer",
    description:
      "Personal portfolio of Ahmad Haizul Amany, a full stack developer crafting dynamic web experiences with Next.js.",
    openGraph: {
      title: "Heinz - Full Stack Developer",
      description:
        "Dark-space portfolio for web projects, writing, and visual craft by Ahmad Haizul Amany.",
      type: "website",
      images: ["/og?title=Heinz&type=page"],
    },
    twitter: {
      card: "summary_large_image",
      title: "Heinz - Full Stack Developer",
      description:
        "Personal portfolio of Ahmad Haizul Amany, a full stack developer crafting dynamic web experiences with Next.js.",
      images: ["/og?title=Heinz&type=page"],
    },
  };
}

async function getHomeData() {
  "use cache";
  cacheLife("hours");

  const [owner, phases, logos, testimonials] = await Promise.all([
    db.user.findFirst({
      select: {
        name: true,
        tagline: true,
        bio: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    }),
    db.homeSection.findMany({
      where: {
        type: "PHASE",
      },
      select: {
        id: true,
        label: true,
        content: true,
        order: true,
      },
      orderBy: {
        order: "asc",
      },
    }),
    db.homeSection.findMany({
      where: {
        type: "LOGO",
      },
      select: {
        id: true,
        label: true,
        imageUrl: true,
        order: true,
      },
      orderBy: {
        order: "asc",
      },
    }),
    db.testimonial.findMany({
      select: {
        id: true,
        name: true,
        role: true,
        company: true,
        avatar: true,
        content: true,
        order: true,
      },
      orderBy: {
        order: "asc",
      },
    }),
  ]);

  return {
    owner,
    phases,
    logos,
    testimonials,
  };
}

export default async function HomePage() {
  const { owner, phases, logos, testimonials } = await getHomeData();
  const title = "Transforming Concepts into Seamless User Experiences";
  const description =
    owner?.bio ??
    `Hi! I'm Heinz, a ${owner?.tagline ?? "Full Stack Developer"} based in Central Java, Indonesia.`;

  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <div className="relative flex min-h-screen w-full flex-col items-center overflow-x-hidden text-white">
        <PublicBackground variant="home" />
        <section className="h-screen w-full">
          <HeroSection
            title={title}
            subtitle="Dynamic Web Magic with Next.js"
            description={description}
          />
        </section>

        <div className="relative z-10 mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-10">
            {/* <RecentProjectsSection /> */}
            <ApproachSection phases={phases} />
            {/* <RecentPostsSection /> */}
            <ClientsSection logos={logos} testimonials={testimonials} />
          </div>
        </div>

        <div className="h-32" />
      </div>
    </div>
  );
}
