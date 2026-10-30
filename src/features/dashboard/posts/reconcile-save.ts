import type { PostFormInput } from "./validations";

/** Reconcile only persisted publication fields; retain newer edits and pending intent. */
export function reconcilePostSave(
  snapshot: PostFormInput,
  current: PostFormInput,
  status: "draft" | "published",
  publishedAt: string | null,
  automatic = false,
) {
  const values = structuredClone(current);
  const sameIntent =
    values.scheduledPublishDate === snapshot.scheduledPublishDate &&
    values.publicationIntent === snapshot.publicationIntent;
  const pendingDraftPlan =
    status === "draft" &&
    values.status === "draft" &&
    values.publicationIntent === "schedule" &&
    Boolean(values.scheduledPublishDate);
  if (!automatic && sameIntent && !pendingDraftPlan) {
    values.scheduledPublishDate = publishedAt ?? undefined;
    values.publicationIntent = "keep";
  }
  return {
    baseline: {
      ...snapshot,
      status,
      scheduledPublishDate: publishedAt ?? undefined,
      publicationIntent: "keep" as const,
    },
    values: { ...values, status },
    pendingDraftPlan,
  };
}
