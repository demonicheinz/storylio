import { describe, expect, it } from "vitest";
import { reconcilePostSave } from "@/features/dashboard/posts/reconcile-save";

const future = "2099-01-01T10:00:00.000Z",
  older = "2098-01-01T10:00:00.000Z";
const draft = {
  title: "Test",
  slug: "test",
  content: "Body",
  status: "draft" as const,
  publicationIntent: "schedule" as const,
  scheduledPublishDate: future,
};
describe("post saved baseline", () => {
  it("keeps pending schedule dirty after content autosave", () => {
    const snapshot = { ...draft, status: "published" as const };
    const result = reconcilePostSave(
      snapshot,
      snapshot,
      "published",
      older,
      true,
    );
    expect(result.baseline.scheduledPublishDate).toBe(older);
    expect(result.values.scheduledPublishDate).toBe(future);
    expect(result.values.publicationIntent).toBe("schedule");
  });
  it("keeps an inactive draft plan visibly unsaved", () => {
    const result = reconcilePostSave(draft, draft, "draft", null);
    expect(result.pendingDraftPlan).toBe(true);
    expect(result.baseline.scheduledPublishDate).toBeUndefined();
    expect(result.values.scheduledPublishDate).toBe(future);
  });
  it("cancels the schedule when withdrawing a scheduled post", () => {
    const snapshot = {
      ...draft,
      status: "published" as const,
      publicationIntent: "keep" as const,
    };
    const result = reconcilePostSave(snapshot, snapshot, "draft", null);
    expect(result.pendingDraftPlan).toBe(false);
    expect(result.values.scheduledPublishDate).toBeUndefined();
    expect(result.values.publicationIntent).toBe("keep");
  });
  it("preserves newer content and schedule edits made during an explicit request", () => {
    const current = {
      ...draft,
      title: "New title",
      scheduledPublishDate: older,
    };
    const result = reconcilePostSave(draft, current, "published", future);
    expect(result.values.title).toBe("New title");
    expect(result.values.scheduledPublishDate).toBe(older);
    expect(result.values.publicationIntent).toBe("schedule");
  });
});
