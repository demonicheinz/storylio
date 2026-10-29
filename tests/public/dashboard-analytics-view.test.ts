import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AnalyticsLocalView } from "@/features/dashboard/analytics/components/analytics-local-view";
import type { AnalyticsData } from "@/features/dashboard/analytics/queries";

vi.mock("@/features/dashboard/analytics/components/analytics-charts", () => ({
  ViewsTimelineChart: () => createElement("div", { "data-test-chart": true }),
}));

function data(): AnalyticsData {
  return {
    generatedAt: new Date("2026-10-29T12:00:00Z"),
    postViews: 20,
    projectViews: 10,
    totalViewEvents: 8,
    publishedPosts: 1,
    draftPosts: 1,
    scheduledPosts: 1,
    timeline: [{ date: "2026-10-29", views: 3 }],
    recentViews: [
      {
        id: "event",
        type: "post",
        slug: "long-slug",
        createdAt: new Date("2026-10-29T11:00:00Z"),
      },
    ],
    topPosts: [
      {
        id: "future",
        title: "A future article",
        slug: "future",
        status: "PUBLISHED",
        viewCount: 12,
        publishedAt: new Date("2026-10-30T12:00:00Z"),
      },
    ],
    topProjects: [
      {
        id: "draft",
        title: "A historical draft",
        slug: "draft",
        status: "DRAFT",
        viewCount: 4,
      },
    ],
  };
}

describe("Analytics local presentation", () => {
  it("renders each ranked title once with snapshot-consistent status and editor links", () => {
    const html = renderToStaticMarkup(
      createElement(AnalyticsLocalView, { data: data() }),
    );
    expect(html.match(/A future article/g)).toHaveLength(1);
    expect(html).toContain("Scheduled");
    expect(html).toContain("Draft");
    expect(html).toContain('href="/dashboard/posts/future/edit"');
    expect(html).not.toContain('href="/blog/future"');
    expect(html).not.toContain("Content inventory");
  });

  it("exposes exact daily values, UTC scope and optional diagnostics", () => {
    const html = renderToStaticMarkup(
      createElement(AnalyticsLocalView, { data: data() }),
    );
    expect(html).toContain("Daily views (UTC)");
    expect(html).toContain("2026-10-29");
    expect(html).toContain("View daily values");
    expect(html).toContain("Recent activity");
    expect(html).toContain("Lifetime details");
    expect(html).toContain("24 hours");
  });

  it("distinguishes no records from existing zero-view records", () => {
    const value = data();
    value.timeline[0].views = 0;
    value.topPosts = [];
    value.topProjects[0].viewCount = 0;
    const html = renderToStaticMarkup(
      createElement(AnalyticsLocalView, { data: value }),
    );
    expect(html).toContain("No recent views");
    expect(html).toContain("No posts yet");
    expect(html).toContain("A historical draft");
    expect(html).not.toContain("No projects yet");
    expect(html).not.toContain("NaN");
  });
});
