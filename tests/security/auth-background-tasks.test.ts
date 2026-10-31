import { afterAll, assert, beforeAll, describe, expect, it, vi } from "vitest";

const scheduled = vi.hoisted(() => vi.fn());
vi.mock("next/server", () => ({ after: scheduled }));
vi.mock("@/lib/db", () => ({ db: {} }));
let auth: typeof import("../../src/lib/auth").auth;
beforeAll(async () => {
  vi.stubEnv("BETTER_AUTH_URL", "https://auth-background.test");
  vi.stubEnv(
    "BETTER_AUTH_SECRET",
    "background-fixture-secret-never-for-production",
  );
  ({ auth } = await import("../../src/lib/auth"));
});
afterAll(() => vi.unstubAllEnvs());

describe("authentication background task rejection timing", () => {
  it("handles a rejection before after-response work is released", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    let reject!: (reason: unknown) => void;
    const task = new Promise<void>((_resolve, fail) => {
      reject = fail;
    });
    const caught = vi.spyOn(task, "catch");
    try {
      const handler = auth.options.advanced?.backgroundTasks?.handler;
      assert.exists(handler);
      handler(task);
      // Do not invoke an after-response callback: the response is still open.
      reject(new Error("Fixture mail transport failure"));
      expect(caught).toHaveBeenCalledOnce();
      const call = scheduled.mock.calls.at(-1);
      assert.exists(call);
      const passed = call[0];
      expect(passed).toBeInstanceOf(Promise);
      await expect(passed).resolves.toBeUndefined();
      expect(log).toHaveBeenCalledWith(
        "An authentication background task failed.",
      );
    } finally {
      // Also contain the deliberately rejected promise when testing the old code.
      await task.catch(() => {});
      log.mockRestore();
    }
  });
});
