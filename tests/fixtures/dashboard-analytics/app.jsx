import { createRoot } from "react-dom/client";
import AnalyticsLoading from "@/app/(dashboard)/dashboard/analytics/loading";
import { AnalyticsLocalView } from "@/features/dashboard/analytics/components/analytics-local-view";
import { AnalyticsTabs } from "@/features/dashboard/analytics/components/analytics-tabs";
import { UmamiPanelClient } from "@/features/dashboard/analytics/components/umami-panel";
import shell from "@/features/dashboard/shell/dashboard-shell.module.css";

const stamp = new Date("2026-10-29T14:00:00Z");
const titles = [
  "Building Storylio With Server-first Pages",
  "Designing Calm Interfaces For Repeated Work",
  "AReallyLongUnbrokenTitleToVerifySmallScreenWrappingAndKeyboardAccess",
  "Keeping the hero image sharp",
  "Giving the stack one row",
];
const params = new URLSearchParams(location.search);
const empty = params.has("empty");
const rows = {
  generatedAt: stamp,
  postViews: empty ? 0 : 1478,
  projectViews: empty ? 0 : 805,
  totalViewEvents: empty ? 0 : 721,
  publishedPosts: empty ? 0 : 3,
  draftPosts: empty ? 0 : 1,
  scheduledPosts: empty ? 0 : 1,
  timeline: Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.UTC(2026, 8, 30 + i)).toISOString().slice(0, 10),
    views: empty ? 0 : [0, 2, 5, 2, 11, 8, 0, 3, 6, 20][i % 10],
  })),
  topPosts: empty
    ? []
    : titles.map((title, i) => ({
        id: `post-${i}`,
        title,
        slug: `post-${i}`,
        status: i === 3 ? "DRAFT" : "PUBLISHED",
        publishedAt: i === 2 ? new Date("2026-11-01T00:00:00Z") : null,
        viewCount: 400 - i * 75,
      })),
  topProjects: empty
    ? []
    : [
        "Storylio",
        "Nebula Commerce",
        "Pulse Analytics",
        "Canvas Notes",
        "Archive Draft",
      ].map((title, i) => ({
        id: `project-${i}`,
        title,
        slug: `project-${i}`,
        status: i === 4 ? "DRAFT" : "PUBLISHED",
        viewCount: 300 - i * 60,
      })),
  recentViews: empty
    ? []
    : titles.map((_, i) => ({
        id: `event-${i}`,
        type: i % 2 ? "post" : "project",
        slug: "a-long-slug-to-check-compact-layout-on-mobile-devices",
        createdAt: stamp,
      })),
};
const metric = (value, change = 12) => ({ value, change });
window.analyticsUmami = {
  status: empty ? "not-configured" : "available",
  fetchedAt: stamp.toISOString(),
  range: { startAt: stamp.getTime() - 30 * 86400000, endAt: stamp.getTime() },
  pageviews: metric(2780),
  visitors: metric(625),
  visits: metric(850),
  bounceRate: metric(48, -5),
  visitDuration: metric(102),
  topPages: [
    {
      name: "/blog/a-long-path-that-remains-readable-and-accessible-on-mobile-devices",
      value: 490,
    },
  ],
  referrers: [{ name: "github.com", value: 129 }],
  browsers: [{ name: "Chrome", value: 425 }],
  locations: [{ name: "Indonesia", value: 305 }],
  details: Object.fromEntries(
    ["topPages", "referrers", "browsers", "locations"].map((key) => [
      key,
      { status: "available" },
    ]),
  ),
};
window.analyticsCalls = 0;
window.analyticsRefresh = async () => {
  window.analyticsCalls++;
  if (window.analyticsHold)
    await new Promise((resolve) => (window.analyticsRelease = resolve));
  if (window.analyticsReject) throw Error("Fixture action delivery failure");
  return structuredClone(window.analyticsUmami);
};
createRoot(document.getElementById("root")).render(
  <main className={shell.shell}>
    <div className={shell.content}>
      {params.has("loading") ? (
        <AnalyticsLoading />
      ) : (
        <div className="flex flex-col gap-6 min-w-0">
          <header>
            <h1 className="font-heading">Analytics</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground text-sm leading-6">
              See how your content is being read, and explore website traffic
              separately.
            </p>
          </header>
          <AnalyticsTabs
            content={<AnalyticsLocalView data={rows} />}
            traffic={
              <UmamiPanelClient
                initialAnalytics={structuredClone(window.analyticsUmami)}
              />
            }
          />
        </div>
      )}
    </div>
  </main>,
);
