import { describe, expect, it } from "vitest";
import { createConfirmationController } from "@/features/dashboard/shared/confirmation";

describe("dashboard confirmation controller", () => {
  it("fails closed without a mounted host", async () => {
    expect(await createConfirmationController().request("Discard?")).toBe(
      false,
    );
  });
  it("only approves after the close transition completes", async () => {
    const controller = createConfirmationController();
    const detach = controller.mount();
    const result = controller.request("Discard?");
    let answer: boolean | undefined;
    void result.then((value) => {
      answer = value;
    });
    controller.close(true);
    await Promise.resolve();
    expect(answer).toBeUndefined();
    controller.finish();
    expect(await result).toBe(true);
    expect(controller.getSnapshot()).toBeNull();
    detach();
  });
  it("cancels on host unmount even if approval had started closing", async () => {
    const controller = createConfirmationController();
    const detach = controller.mount();
    const result = controller.request("Delete?");
    controller.close(true);
    detach();
    expect(await result).toBe(false);
  });
  it("rejects duplicate requests rather than replacing the pending decision", async () => {
    const controller = createConfirmationController();
    const detach = controller.mount();
    const result = controller.request("First");
    expect(await controller.request("Second")).toBe(false);
    expect(controller.getSnapshot()?.message).toBe("First");
    controller.close(false);
    controller.finish();
    expect(await result).toBe(false);
    detach();
  });
  it("ignores duplicate close and completion events", async () => {
    const controller = createConfirmationController();
    const detach = controller.mount();
    const result = controller.request("First");
    controller.close(false);
    controller.close(true);
    controller.finish();
    controller.finish();
    expect(await result).toBe(false);
    detach();
  });
});
