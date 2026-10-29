export type PostPublicationState = "draft" | "scheduled" | "published";

export function getPostPublicationState(
  status: string,
  publishedAt: string | null | undefined,
  now: number,
): PostPublicationState {
  if (status !== "published" && status !== "PUBLISHED") return "draft";
  return publishedAt && new Date(publishedAt).getTime() > now
    ? "scheduled"
    : "published";
}
