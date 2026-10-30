import {
  and,
  count,
  desc,
  eq,
  gt,
  gte,
  isNull,
  lte,
  or,
  sql,
  sum,
} from "drizzle-orm";
import { db } from "@/lib/db";
import { post, project, viewEvent } from "@/lib/db/schema";

export async function getAnalyticsData(now = new Date()) {
  const generatedAt = new Date(now);
  const timelineStart = new Date(generatedAt);
  timelineStart.setUTCHours(0, 0, 0, 0);
  timelineStart.setUTCDate(timelineStart.getUTCDate() - 29);

  const publishedPost = and(
    eq(post.status, "PUBLISHED"),
    or(isNull(post.publishedAt), lte(post.publishedAt, generatedAt)),
  );
  const scheduledPost = and(
    eq(post.status, "PUBLISHED"),
    gt(post.publishedAt, generatedAt),
  );
  // createdAt is a UTC timestamp without time zone. Format it directly so the
  // database session's timezone cannot shift an event into a different day.
  const utcDay = sql<string>`to_char(${viewEvent.createdAt}, 'YYYY-MM-DD')`;

  const [
    posts,
    projects,
    totalViewEvents,
    topPosts,
    topProjects,
    days,
    recentViews,
  ] = await Promise.all([
    db
      .select({
        views: sum(post.viewCount).mapWith(Number),
        published: sql`count(*) filter (where ${publishedPost})`.mapWith(
          Number,
        ),
        drafts: sql`count(*) filter (where ${post.status} = 'DRAFT')`.mapWith(
          Number,
        ),
        scheduled: sql`count(*) filter (where ${scheduledPost})`.mapWith(
          Number,
        ),
      })
      .from(post)
      .then(([row]) => row),
    db
      .select({ views: sum(project.viewCount).mapWith(Number) })
      .from(project)
      .then(([row]) => row),
    db.$count(viewEvent),
    // Rankings retain lifetime views even when content is now draft/scheduled.
    db.query.post.findMany({
      orderBy: [desc(post.viewCount), desc(post.createdAt), desc(post.id)],
      limit: 5,
      columns: {
        id: true,
        title: true,
        slug: true,
        status: true,
        viewCount: true,
        publishedAt: true,
      },
    }),
    db.query.project.findMany({
      orderBy: [
        desc(project.viewCount),
        desc(project.createdAt),
        desc(project.id),
      ],
      limit: 5,
      columns: {
        id: true,
        title: true,
        slug: true,
        status: true,
        viewCount: true,
      },
    }),
    db
      .select({ date: utcDay, views: count() })
      .from(viewEvent)
      .where(
        and(
          gte(viewEvent.createdAt, timelineStart),
          lte(viewEvent.createdAt, generatedAt),
        ),
      )
      .groupBy(utcDay),
    db.query.viewEvent.findMany({
      orderBy: [desc(viewEvent.createdAt), desc(viewEvent.id)],
      limit: 5,
      columns: { id: true, type: true, slug: true, createdAt: true },
    }),
  ]);

  const viewsByDay = new Map(days.map((day) => [day.date, day.views]));
  const timeline = Array.from({ length: 30 }, (_, index) => {
    const day = new Date(timelineStart);
    day.setUTCDate(day.getUTCDate() + index);
    const date = day.toISOString().slice(0, 10);
    return { date, views: viewsByDay.get(date) ?? 0 };
  });

  return {
    generatedAt,
    postViews: posts.views ?? 0,
    projectViews: projects.views ?? 0,
    totalViewEvents,
    publishedPosts: posts.published,
    draftPosts: posts.drafts,
    scheduledPosts: posts.scheduled,
    topPosts,
    topProjects,
    timeline,
    recentViews,
  };
}

export type AnalyticsData = Awaited<ReturnType<typeof getAnalyticsData>>;
