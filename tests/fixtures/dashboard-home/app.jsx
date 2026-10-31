import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { HomeContentManager } from "@/features/dashboard/home/components/home-section-form";
import { DashboardConfirmationHost } from "@/features/dashboard/shared/components/confirmation-dialog";

const svg =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="#89d9ff"/></svg>',
  );
const settings = (category = "TECHNOLOGY", showOnHome = true) =>
  JSON.stringify({
    kind: "home-logo",
    version: 1,
    category,
    showOnHome,
    description: "",
  });
const now = "2026-10-28T00:00:00.000Z";
const initial = {
  headline: "I build thoughtful web applications.",
  subheadline: "Example profile bio for a local layout review.",
  phases: ["Discovery", "Design & Build", "Launch & Support"].map(
    (label, i) => ({
      id: `phase-${i}`,
      type: "PHASE",
      label,
      content:
        "A practical description of this phase with enough detail to stay readable on a narrow mobile display.",
      imageUrl: null,
      order: i,
      createdAt: now,
    }),
  ),
  logos: [
    "Next.js",
    "React",
    "TypeScript",
    "Node.js",
    "PostgreSQL",
    "A deliberately long custom technology name",
    "Client example",
  ].map((label, i) => ({
    id: `logo-${i}`,
    type: "LOGO",
    label,
    content: settings(i === 6 ? "CLIENT" : "TECHNOLOGY", i !== 6),
    imageUrl: i >= 5 ? svg : null,
    order: i,
    createdAt: now,
  })),
};
window.homeFixture = {
  records: structuredClone(initial),
  calls: [],
  pending: [],
  mode: "success",
  refreshes: 0,
  reset() {
    this.records = structuredClone(initial);
    this.calls = [];
    this.pending = [];
    this.mode = "success";
    window.dispatchEvent(new Event("fixture-refresh"));
  },
  async action(name, args) {
    this.calls.push({ name, args: structuredClone(args) });
    if (this.mode === "throw") throw new Error("Fixture offline");
    if (this.mode === "failure")
      return { success: false, error: "Fixture could not save. Try again." };
    if (this.mode === "deferred")
      return new Promise((resolve) =>
        this.pending.push(() => resolve(this.commit(name, args))),
      );
    return this.commit(name, args);
  },
  commit(name, args) {
    if (name === "actionSetHeroHeadline")
      this.records.headline = args[0].headline;
    if (name === "actionReorderHomeSections")
      for (const item of args[0])
        for (const list of [this.records.phases, this.records.logos]) {
          const row = list.find((r) => r.id === item.id);
          if (row) row.order = item.order;
        }
    if (name === "actionUpdateHomeSection") {
      const row = [...this.records.phases, ...this.records.logos].find(
        (r) => r.id === args[0],
      );
      if (row)
        Object.assign(row, args[1], {
          content:
            args[1].type === "LOGO"
              ? settings(args[1].category, args[1].showOnHome)
              : args[1].content,
        });
    }
    return { success: true, data: { id: "fixture-id" }, message: "Saved." };
  },
};
function App() {
  const [path, setPath] = useState(location.pathname);
  useEffect(() => {
    const update = () => setPath(location.pathname);
    window.addEventListener("popstate", update);
    return () => window.removeEventListener("popstate", update);
  }, []);
  const [data, setData] = useState(window.homeFixture.records);
  useEffect(() => {
    const sync = () => setData(structuredClone(window.homeFixture.records));
    window.addEventListener("fixture-refresh", sync);
    return () => window.removeEventListener("fixture-refresh", sync);
  }, []);
  if (path === "/previous")
    return (
      <main>
        <h1>Previous page</h1>
        <a
          href="/"
          onClick={(event) => {
            event.preventDefault();
            history.pushState(null, "", "/");
            window.dispatchEvent(new PopStateEvent("popstate"));
          }}
        >
          Open Home
        </a>
      </main>
    );
  return (
    <main className="mx-auto px-4 md:px-8 py-6 w-full max-w-5xl">
      <p className="mb-4 text-muted-foreground text-xs">
        Local preview · example content
      </p>
      <h1 className="mb-2 font-heading font-semibold text-3xl">Home</h1>
      <p className="mb-6 text-muted-foreground text-sm">
        Edit the Hero, Approach, and Tech stack on the public Home page.
      </p>
      <HomeContentManager
        {...data}
        phases={[...data.phases].sort((a, b) => a.order - b.order)}
        logos={[...data.logos].sort((a, b) => a.order - b.order)}
      />
    </main>
  );
}
createRoot(document.getElementById("root")).render(
  <>
    <DashboardConfirmationHost />
    {<App />}
  </>,
);
