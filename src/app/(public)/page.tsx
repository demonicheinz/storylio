import { asc, desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { Suspense } from "react";
import {
  ApproachSection,
  HeroSection,
  NotesSection,
  RecentPostsSection,
  RecentProjectsSection,
  TechStackSection,
} from "@/components/public/sections/home";
import styles from "@/components/public/sections/home/home.module.css";
import { db } from "@/lib/db";
import { ProjectStatus } from "@/lib/db/enums";
import { flattenPostTags, orderPostTagsByName } from "@/lib/db/query-utils";
import { postToTag, tag } from "@/lib/db/schema";
import { HOME_NOTES_TAG, homePostWhere } from "@/lib/home-content";
import { HOME_HERO_ID, resolveHomeHero } from "@/lib/home-hero";
import { selectHomeTechnologies } from "@/lib/home-technologies";
import { PUBLIC_CACHE_TAGS } from "@/lib/public-cache-tags";

export const metadata: Metadata = {
  title: "Heinz — Full Stack Developer | Storylio",
  description:
    "Web applications, projects and writing by Heinz, a full stack web developer based in Central Java, Indonesia.",
  openGraph: {
    title: "Heinz — Full Stack Developer | Storylio",
    description: "Web projects and the decisions behind them, by Heinz.",
    type: "website",
    images: ["/og?title=Heinz&type=page"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Heinz — Full Stack Developer | Storylio",
    description:
      "Web applications, projects and writing by Heinz, a full stack web developer based in Central Java, Indonesia.",
    images: ["/og?title=Heinz&type=page"],
  },
};

async function getHomeData() {
  "use cache";
  cacheLife("hours");
  cacheTag(
    PUBLIC_CACHE_TAGS.home,
    PUBLIC_CACHE_TAGS.projects,
    PUBLIC_CACHE_TAGS.posts,
    PUBLIC_CACHE_TAGS.profile,
  );

  const now = new Date();
  const noteIds = db
    .select({ postId: postToTag.postId })
    .from(postToTag)
    .innerJoin(tag, eq(postToTag.tagId, tag.id))
    .where(eq(tag.name, HOME_NOTES_TAG));
  function getPosts(kind: "writing" | "notes") {
    return db.query.post
      .findMany({
        where: (table) => homePostWhere(table, kind, now, noteIds),
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
            with: { tag: { columns: { id: true, name: true } } },
            orderBy: orderPostTagsByName,
          },
        },
      })
      .then((rows) => rows.map((row) => flattenPostTags(row)));
  }

  const [owner, hero, phases, logos, recentProjects, recentPosts, notes] =
    await Promise.all([
      db.query.user.findFirst({
        columns: { bio: true },
        orderBy: (table) => [asc(table.createdAt)],
      }),
      // Lookup by ID also works before the additive HERO enum migration is deployed.
      db.query.homeSection.findFirst({
        where: (table) => eq(table.id, HOME_HERO_ID),
        columns: { label: true, type: true },
      }),
      db.query.homeSection.findMany({
        where: (table) => eq(table.type, "PHASE"),
        columns: { id: true, label: true, content: true, order: true },
        orderBy: (table) => [asc(table.order)],
      }),
      db.query.homeSection.findMany({
        where: (table) => eq(table.type, "LOGO"),
        columns: {
          id: true,
          label: true,
          imageUrl: true,
          order: true,
          content: true,
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
          limit: 3,
        })
        .then((rows) =>
          rows.map((row) => ({ ...row, techStack: row.techStack ?? [] })),
        ),
      getPosts("writing"),
      getPosts("notes"),
    ]);

  return {
    hero: resolveHomeHero(
      hero?.type === "HERO" ? hero.label : null,
      owner?.bio,
    ),
    phases,
    logos,
    notes,
    recentProjects,
    recentPosts,
  };
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ note?: string | string[] }>;
}) {
  const { hero, phases, logos, recentProjects, recentPosts, notes } =
    await getHomeData();

  return (
    <main className={`${styles.surface} ${styles.page}`} data-home-page>
      <HeroSection {...hero} />
      <div className={styles.content}>
        <RecentProjectsSection projects={recentProjects} />
        <ApproachSection phases={phases} />
        <TechStackSection
          logos={selectHomeTechnologies(logos).map(
            ({ id, label, imageUrl, order }) => ({
              id,
              label,
              imageUrl,
              order,
            }),
          )}
        />
        <RecentPostsSection posts={recentPosts} />
        <Suspense fallback={null}>
          <NotesSection posts={notes} searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}
