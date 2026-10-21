import { and, asc, desc, eq, isNull, lte, or } from "drizzle-orm";
import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import { MotionReveal, PublicBackground } from "@/components/common";
import {
  ApproachSection,
  ClientsSection,
  HeroSection,
  RecentPostsSection,
  RecentProjectsSection,
} from "@/components/public/sections/home";
import { db } from "@/lib/db";
import { PostStatus, ProjectStatus } from "@/lib/db/enums";
import { flattenPostTags, orderPostTagsByName } from "@/lib/db/query-utils";

export const metadata: Metadata = {
  title: "Heinz — Full Stack Developer | Storylio",
  description:
    "Personal portfolio of Ahmad Haizul Amany, a full stack developer crafting dynamic web experiences with Next.js.",
  openGraph: {
    title: "Heinz — Full Stack Developer | Storylio",
    description:
      "Dark-space portfolio for web projects, writing, and visual craft by Ahmad Haizul Amany.",
    type: "website",
    images: ["/og?title=Heinz&type=page"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Heinz — Full Stack Developer | Storylio",
    description:
      "Personal portfolio of Ahmad Haizul Amany, a full stack developer crafting dynamic web experiences with Next.js.",
    images: ["/og?title=Heinz&type=page"],
  },
};

async function getHomeData() {
  "use cache";
  cacheLife("hours");

  const now = new Date();
  const [owner, phases, logos, testimonials, recentProjects, recentPosts] =
    await Promise.all([
      db.query.user
        .findFirst({
          columns: { name: true, image: true, tagline: true, bio: true },
          orderBy: (table) => [asc(table.createdAt)],
        })
        .then((row) => row ?? null),
      db.query.homeSection.findMany({
        where: (table) => eq(table.type, "PHASE"),
        columns: { id: true, label: true, content: true, order: true },
        orderBy: (table) => [asc(table.order)],
      }),
      db.query.homeSection.findMany({
        where: (table) => eq(table.type, "LOGO"),
        columns: { id: true, label: true, imageUrl: true, order: true },
        orderBy: (table) => [asc(table.order)],
      }),
      db.query.testimonial.findMany({
        where: (table) => eq(table.isVisible, true),
        columns: {
          id: true,
          name: true,
          role: true,
          company: true,
          avatar: true,
          content: true,
          order: true,
        },
        orderBy: (table) => [asc(table.order)],
      }),
      db.query.project
        .findMany({
          where: (table) => eq(table.status, ProjectStatus.PUBLISHED),
          columns: {
            id: true,
            title: true,
            slug: true,
            description: true,
            coverImage: true,
            thumbnailImageUrl: true,
            isFeatured: true,
            isClosedSource: true,
            techStack: true,
            order: true,
            createdAt: true,
          },
          orderBy: (table) => [
            desc(table.isFeatured),
            asc(table.order),
            desc(table.createdAt),
          ],
          limit: 4,
        })
        .then((rows) =>
          rows.map((row) => ({ ...row, techStack: row.techStack ?? [] })),
        ),
      db.query.post
        .findMany({
          where: (table) =>
            and(
              eq(table.status, PostStatus.PUBLISHED),
              or(isNull(table.publishedAt), lte(table.publishedAt, now)),
            ),
          columns: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            content: true,
            coverImage: true,
            publishedAt: true,
            createdAt: true,
          },
          orderBy: (table) => [desc(table.publishedAt), desc(table.createdAt)],
          limit: 3,
          with: {
            tags: {
              columns: {},
              with: {
                tag: {
                  columns: {
                    id: true,
                    name: true,
                  },
                },
              },
              orderBy: orderPostTagsByName,
            },
          },
        })
        .then((rows) => rows.map((row) => flattenPostTags(row))),
    ]);

  return {
    owner,
    phases,
    logos,
    testimonials,
    recentProjects,
    recentPosts,
  };
}

export default async function HomePage() {
  const { owner, phases, logos, testimonials, recentProjects, recentPosts } =
    await getHomeData();
  const title = "Transforming Concepts into Seamless User Experiences";
  const description =
    owner?.bio ??
    `Hi! I'm Heinz, a ${owner?.tagline ?? "Full Stack Developer"} based in Central Java, Indonesia.`;

  return (
    <div className="flex flex-col flex-1 justify-center items-center">
      <div className="relative flex flex-col items-center w-full min-h-screen overflow-x-hidden text-white">
        <PublicBackground variant="home" />
        <section className="w-full h-screen">
          <HeroSection
            title={title}
            subtitle="Dynamic Web Magic with Next.js"
            description={description}
            avatar={owner?.image}
            avatarAlt={owner?.name ?? "Heinz Avatar"}
          />
        </section>

        <div className="z-10 relative mx-auto px-4 sm:px-6 lg:px-8 w-full max-w-350">
          <div className="flex flex-col gap-10">
            <MotionReveal>
              <RecentProjectsSection projects={recentProjects} />
            </MotionReveal>
            <MotionReveal>
              <ApproachSection phases={phases} />
            </MotionReveal>
            <MotionReveal>
              <RecentPostsSection posts={recentPosts} />
            </MotionReveal>
            <MotionReveal>
              <ClientsSection logos={logos} testimonials={testimonials} />
            </MotionReveal>
          </div>
        </div>

        <div className="h-32" />
      </div>
    </div>
  );
}
