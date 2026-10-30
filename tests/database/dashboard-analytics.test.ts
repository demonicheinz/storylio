import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import * as schema from "@/lib/db/schema";
import { createTestDatabase } from "../helpers/database";

let fixture: Awaited<ReturnType<typeof createTestDatabase>>;
let getAnalyticsData: typeof import("@/features/dashboard/analytics/queries").getAnalyticsData;
const now = new Date("2026-10-29T12:34:56.789Z");

beforeAll(async () => {
  fixture = await createTestDatabase();
  vi.doMock("@/lib/db", () => ({ db: fixture.db }));
  ({ getAnalyticsData } = await import(
    "@/features/dashboard/analytics/queries"
  ));
});

beforeEach(async () => {
  await fixture.db.delete(schema.viewEvent);
  await fixture.db.delete(schema.user);
  await fixture.db
    .insert(schema.user)
    .values({ id: "owner", email: "analytics@example.test" });
});

afterEach(() => {
  vi.useRealTimers();
});

afterAll(async () => {
  vi.doUnmock("@/lib/db");
  await fixture.client.close();
});

describe("dashboard analytics data", () => {
  it("returns the exact empty contract with thirty zero-filled UTC days", async () => {
    const data = await getAnalyticsData(now);
    expect(data).toEqual({
      generatedAt: now,
      postViews: 0,
      projectViews: 0,
      totalViewEvents: 0,
      publishedPosts: 0,
      draftPosts: 0,
      scheduledPosts: 0,
      topPosts: [],
      topProjects: [],
      timeline: Array.from({ length: 30 }, (_, day) => ({
        date: new Date(Date.UTC(2026, 8, 30 + day)).toISOString().slice(0, 10),
        views: 0,
      })),
      recentViews: [],
    });
  });

  it("captures the default clock once for publication and timeline cutoffs", async () => {
    await fixture.db.insert(schema.post).values({
      id: "clock-boundary",
      authorId: "owner",
      title: "At midnight",
      slug: "clock-boundary",
      content: "Content",
      status: "PUBLISHED",
      publishedAt: new Date("2026-11-01T00:00:00.000Z"),
    });
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-31T23:59:59.999Z"));
    const pending = getAnalyticsData();
    vi.setSystemTime(new Date("2026-11-01T00:00:00.000Z"));
    const data = await pending;
    expect(data.generatedAt).toEqual(new Date("2026-10-31T23:59:59.999Z"));
    expect(data.publishedPosts).toBe(0);
    expect(data.scheduledPosts).toBe(1);
    expect(data.timeline[0].date).toBe("2026-10-02");
    expect(data.timeline.at(-1)?.date).toBe("2026-10-31");
  });

  it("matches Overview at the inclusive publication boundary and separates schedules from drafts", async () => {
    await fixture.db.insert(schema.post).values(
      [
        { id: "legacy", status: "PUBLISHED", publishedAt: null },
        {
          id: "past",
          status: "PUBLISHED",
          publishedAt: new Date(now.getTime() - 1),
        },
        { id: "boundary", status: "PUBLISHED", publishedAt: now },
        {
          id: "scheduled",
          status: "PUBLISHED",
          publishedAt: new Date(now.getTime() + 1),
        },
        { id: "draft", status: "DRAFT", publishedAt: null },
        { id: "draft-past", status: "DRAFT", publishedAt: now },
        {
          id: "draft-future",
          status: "DRAFT",
          publishedAt: new Date(now.getTime() + 1),
        },
      ].map((item) => ({
        ...item,
        status: item.status as "DRAFT" | "PUBLISHED",
        authorId: "owner",
        title: item.id,
        slug: item.id,
        content: "Content",
      })),
    );
    const data = await getAnalyticsData(now);
    expect(data.publishedPosts).toBe(3);
    expect(data.draftPosts).toBe(3);
    expect(data.scheduledPosts).toBe(1);
  });

  it("aggregates UTC days inclusively and excludes events before the window or after now", async () => {
    // ViewEvent stores UTC timestamps without a timezone; session timezone must
    // not reinterpret those stored calendar days.
    await fixture.client.exec("SET TIME ZONE 'America/Los_Angeles'");
    try {
      await fixture.db.insert(schema.viewEvent).values(
        [
          "2026-09-29T23:59:59.999Z",
          "2026-09-30T00:00:00.000Z",
          "2026-09-30T23:59:59.999Z",
          "2026-10-01T00:00:00.000Z",
          "2026-10-28T23:59:59.999Z",
          "2026-10-29T00:00:00.000Z",
          now.toISOString(),
          "2026-10-29T12:34:56.790Z",
          "2026-10-30T00:00:00.000Z",
        ].map((timestamp, index) => ({
          id: `event-${index}`,
          type: index % 2 ? "post" : "project",
          slug: "historical-content",
          createdAt: new Date(timestamp),
        })),
      );
      const data = await getAnalyticsData(now);
      expect(data.timeline).toHaveLength(30);
      expect(data.timeline.filter((day) => day.views)).toEqual([
        { date: "2026-09-30", views: 2 },
        { date: "2026-10-01", views: 1 },
        { date: "2026-10-28", views: 1 },
        { date: "2026-10-29", views: 2 },
      ]);
      expect(data.timeline.reduce((sum, day) => sum + day.views, 0)).toBe(6);
      expect(data.totalViewEvents).toBe(9);
    } finally {
      await fixture.client.exec("SET TIME ZONE 'UTC'");
    }
  });

  it("keeps thirty UTC calendar days across leap day regardless of the input offset", async () => {
    const data = await getAnalyticsData(new Date("2024-03-01T00:30:00+07:00"));
    expect(data.timeline).toHaveLength(30);
    expect(data.timeline[0]).toEqual({ date: "2024-01-31", views: 0 });
    expect(data.timeline.at(-1)).toEqual({ date: "2024-02-29", views: 0 });
  });

  it("sums all lifetime counters and ranks five historical records with deterministic ties", async () => {
    const rows = [
      { id: "a", viewCount: 2_000_000_000, createdAt: new Date("2020-01-01Z") },
      { id: "b", viewCount: 2_000_000_000, createdAt: new Date("2020-01-02Z") },
      { id: "c", viewCount: 40, createdAt: new Date("2020-01-03Z") },
      { id: "d", viewCount: 40, createdAt: new Date("2020-01-03Z") },
      { id: "e", viewCount: 1, createdAt: new Date("2020-01-04Z") },
      { id: "f", viewCount: 0, createdAt: now },
    ];
    await fixture.db.insert(schema.post).values(
      rows.map((row) => ({
        ...row,
        authorId: "owner",
        title: `Post ${row.id}`,
        slug: `post-${row.id}`,
        content: "Content",
        status: row.id === "a" ? ("DRAFT" as const) : ("PUBLISHED" as const),
        publishedAt: row.id === "b" ? new Date("2027-01-01Z") : null,
      })),
    );
    await fixture.db.insert(schema.project).values(
      rows.map((row) => ({
        ...row,
        authorId: "owner",
        title: `Project ${row.id}`,
        slug: `project-${row.id}`,
        status: row.id === "b" ? ("DRAFT" as const) : ("PUBLISHED" as const),
      })),
    );
    const data = await getAnalyticsData(now);
    expect(data.postViews).toBe(4_000_000_081);
    expect(data.projectViews).toBe(4_000_000_081);
    expect(data.totalViewEvents).toBe(0);
    expect(data.topPosts).toEqual(
      ["b", "a", "d", "c", "e"].map((id) => ({
        id,
        title: `Post ${id}`,
        slug: `post-${id}`,
        status: id === "a" ? "DRAFT" : "PUBLISHED",
        viewCount: rows.find((row) => row.id === id)?.viewCount,
        publishedAt: id === "b" ? new Date("2027-01-01Z") : null,
      })),
    );
    expect(data.topProjects).toEqual(
      ["b", "a", "d", "c", "e"].map((id) => ({
        id,
        title: `Project ${id}`,
        slug: `project-${id}`,
        status: id === "b" ? "DRAFT" : "PUBLISHED",
        viewCount: rows.find((row) => row.id === id)?.viewCount,
      })),
    );
  });

  it("returns only the latest five events, using id to break timestamp ties", async () => {
    const events = ["a", "c", "b", "d", "f", "e"].map((id) => ({
      id,
      type: id === "e" ? "project" : "post",
      slug: `deleted-${id}`,
      createdAt: id === "a" ? new Date("2020-01-01Z") : now,
    }));
    await fixture.db.insert(schema.viewEvent).values(events);
    const data = await getAnalyticsData(now);
    expect(data.recentViews).toEqual(
      ["f", "e", "d", "c", "b"].map((id) =>
        events.find((event) => event.id === id),
      ),
    );
    expect(data.totalViewEvents).toBe(6);
  });
});
