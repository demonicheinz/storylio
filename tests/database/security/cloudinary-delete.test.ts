import { beforeEach, describe, expect, it, vi } from "vitest";
import { deleteFromCloudinary } from "../../../src/lib/cloudinary";

const effects = vi.hoisted(() => ({ destroy: vi.fn() }));
vi.mock("cloudinary", () => ({
  v2: { config: vi.fn(), uploader: { destroy: effects.destroy } },
}));
beforeEach(() => vi.resetAllMocks());

describe("Cloudinary deletion boolean contract", () => {
  it.each(["ok", "not found"])(
    "confirms absence only for a successful destroy response %s",
    async (result) => {
      effects.destroy.mockResolvedValue({ result });
      expect(await deleteFromCloudinary("media/asset")).toBe(true);
      expect(effects.destroy).toHaveBeenCalledWith("media/asset", {
        resource_type: "image",
      });
    },
  );
  it.each([
    { result: "failed" },
    { result: "notfound" },
    {},
    null,
    { result: "not found", error: { message: "Unauthorized" } },
  ])(
    "does not confirm absence for an ambiguous response %s",
    async (result) => {
      effects.destroy.mockResolvedValue(result);
      expect(await deleteFromCloudinary("media/asset")).toBe(false);
    },
  );
  it("propagates errors, including generic HTTP 404 rather than assuming the asset is absent", async () => {
    const error = Object.assign(new Error("wrong endpoint"), {
      http_code: 404,
    });
    effects.destroy.mockRejectedValue(error);
    await expect(deleteFromCloudinary("media/asset")).rejects.toBe(error);
  });
});
