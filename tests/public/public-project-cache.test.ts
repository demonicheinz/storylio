import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPublicProjects } from "@/lib/public-projects";

const cache = vi.hoisted(() => ({
  getProjectFacets: vi.fn(),
  getProjectCount: vi.fn(),
  getProjectRows: vi.fn(),
}));
vi.mock("@/lib/public-project-cache", () => cache);

beforeEach(() => {
  vi.clearAllMocks();
  cache.getProjectFacets.mockResolvedValue({
    technologies: ["alpine", "React", "Zod"],
    totalProjects: 14,
  });
  cache.getProjectCount.mockResolvedValue(14);
  cache.getProjectRows.mockResolvedValue([]);
});

describe("public project cache input boundaries", () => {
  it("shares facets and clamps arbitrary pages before the row cache", async () => {
    for (const page of [3, 999, Number.MAX_SAFE_INTEGER]) {
      const result = await getPublicProjects([], page);
      expect(result.pagination.page).toBe(3);
    }
    expect(cache.getProjectFacets.mock.calls).toEqual([[], [], []]);
    expect(cache.getProjectCount.mock.calls).toEqual([[[]], [[]], [[]]]);
    expect(cache.getProjectRows.mock.calls).toEqual([
      [[], 3],
      [[], 3],
      [[], 3],
    ]);
  });

  it("canonicalizes equivalent selections before both keyed caches", async () => {
    await getPublicProjects([" alpine ", "Zod", "alpine", ""], 1);
    await getPublicProjects(["Zod", "alpine"], 1);
    expect(cache.getProjectCount.mock.calls).toEqual([
      [["Zod", "alpine"]],
      [["Zod", "alpine"]],
    ]);
    expect(cache.getProjectRows.mock.calls).toEqual([
      [["Zod", "alpine"], 1],
      [["Zod", "alpine"], 1],
    ]);
  });

  it.each([
    ["unknown"],
    ["React", "unknown"],
    ["Private tech"],
  ])("keeps unknown selections empty without creating keyed query entries: %j", async (...technologies) => {
    const result = await getPublicProjects(
      technologies,
      Number.MAX_SAFE_INTEGER,
    );
    expect(result.projects).toEqual([]);
    expect(result.totalResults).toBe(0);
    expect(result.totalProjects).toBe(14);
    expect(result.pagination).toMatchObject({ page: 1, pageCount: 0 });
    expect(cache.getProjectCount).not.toHaveBeenCalled();
    expect(cache.getProjectRows).not.toHaveBeenCalled();
  });

  it("does not fetch row entries for valid combinations with no matches", async () => {
    cache.getProjectCount.mockResolvedValue(0);
    const result = await getPublicProjects(["React", "Zod"], 999);
    expect(result.totalResults).toBe(0);
    expect(cache.getProjectRows).not.toHaveBeenCalled();
  });

  it.each([
    NaN,
    Infinity,
    -1,
    0,
    1.5,
  ])("normalizes malformed page %s before the row cache", async (page) => {
    await getPublicProjects([], page);
    expect(cache.getProjectRows).toHaveBeenCalledWith([], 1);
  });
});
