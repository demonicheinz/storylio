import { afterEach, describe, expect, it, vi } from "vitest";
import { revalidatePath, updateTag } from "@/lib/revalidation";

const cache = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  updateTag: vi.fn(),
}));
vi.mock("next/cache", () => cache);
afterEach(() => vi.restoreAllMocks());
describe("post-commit cache invalidation", () => {
  it("preserves route types and tag arguments", () => {
    revalidatePath("/projects/[slug]", "page");
    updateTag("public-projects");
    expect(cache.revalidatePath).toHaveBeenCalledWith(
      "/projects/[slug]",
      "page",
    );
    expect(cache.updateTag).toHaveBeenCalledWith("public-projects");
  });
  it("logs failures without preventing the remaining invalidations", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    cache.updateTag.mockImplementationOnce(() => {
      throw Error("private fixture detail");
    });
    cache.revalidatePath.mockImplementationOnce(() => {
      throw Error("private fixture detail");
    });
    expect(() => {
      updateTag("public-posts");
      revalidatePath("/blog");
      revalidatePath("/");
    }).not.toThrow();
    expect(cache.revalidatePath).toHaveBeenLastCalledWith("/");
    expect(log).toHaveBeenCalledTimes(2);
    expect(JSON.stringify(log.mock.calls)).not.toContain(
      "private fixture detail",
    );
  });
});
