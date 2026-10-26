import { describe, expect, it } from "vitest";
import {
  getHomeLogoSettings,
  selectHomeTechnologies,
  serializeHomeLogoSettings,
} from "@/lib/home-technologies";
import { getTechnologyPage } from "@/lib/technology-pagination";

const configured = (
  label: string,
  category: "TECHNOLOGY" | "CLIENT",
  showOnHome: boolean,
) => ({
  label,
  content: serializeHomeLogoSettings({
    category,
    showOnHome,
    description: "Saved description",
  }),
});

describe("Home logo configuration", () => {
  it("keeps legacy technologies and companies in their existing categories", () => {
    expect(
      getHomeLogoSettings({ label: "Next.js", content: "Original note" }),
    ).toEqual({
      category: "TECHNOLOGY",
      showOnHome: true,
      description: "Original note",
    });
    expect(getHomeLogoSettings({ label: "Acme" })).toEqual({
      category: "CLIENT",
      showOnHome: false,
      description: "",
    });
  });
  it("supports owner-selected technologies beyond the built-in names and five logos", () => {
    const logos = [
      "Astro",
      "Deno",
      "Elixir",
      "SQLite",
      "Solid",
      "Angular",
      "SvelteKit",
    ].map((label) => configured(label, "TECHNOLOGY", true));
    expect(selectHomeTechnologies(logos)).toEqual(logos);
  });
  it("honors hidden/client settings before deduplicating visible labels", () => {
    const visible = configured("React", "TECHNOLOGY", true);
    expect(
      selectHomeTechnologies([
        configured("React", "TECHNOLOGY", false),
        configured("Next.js", "CLIENT", true),
        visible,
        configured("react", "TECHNOLOGY", true),
      ]),
    ).toEqual([visible]);
  });
  it("round-trips a legacy description without exposing client logos", () => {
    const client = configured("React", "CLIENT", true);
    expect(getHomeLogoSettings(client)).toEqual({
      category: "CLIENT",
      showOnHome: false,
      description: "Saved description",
    });
    expect(selectHomeTechnologies([client])).toEqual([]);
  });
  it.each([
    "{broken",
    "null",
    "[]",
    '{"category":"TECHNOLOGY"}',
  ])("handles unconfigured content safely: %s", (content) => {
    expect(getHomeLogoSettings({ label: "Acme", content }).category).toBe(
      "CLIENT",
    );
  });
});

describe("Technology groups", () => {
  it.each([
    3, 4, 6,
  ])("covers every item in filled groups with capacity %i", (capacity) => {
    for (const count of [1, 5, 7, 13, 29]) {
      const items = Array.from({ length: count }, (_, id) => ({ id }));
      const { pages } = getTechnologyPage(items, capacity, 0);
      const groups = Array.from(
        { length: pages },
        (_, page) => getTechnologyPage(items, capacity, page).items,
      );
      expect([...new Set(groups.flat())]).toEqual(items);
      expect(
        groups.every((group) => group.length === Math.min(count, capacity)),
      ).toBe(true);
    }
  });
  it("handles empty data, previous navigation and a smaller page count after resize", () => {
    expect(getTechnologyPage([], 6, 8)).toEqual({
      items: [],
      page: 0,
      pages: 1,
    });
    const items = Array.from({ length: 7 }, (_, id) => id);
    expect(getTechnologyPage(items, 3, -1).items).toEqual([4, 5, 6]);
    expect(getTechnologyPage(items, 6, 2).items).toEqual([0, 1, 2, 3, 4, 5]);
  });
});
