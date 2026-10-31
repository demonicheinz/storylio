import { getPostPublicationState } from "./publication-state";
import type { DashboardPost } from "./types";

export function isPublished(post: DashboardPost, now: number) {
  return (
    getPostPublicationState(post.status, post.publishedAt, now) === "published"
  );
}

export function isScheduled(post: DashboardPost, now: number) {
  return (
    getPostPublicationState(post.status, post.publishedAt, now) === "scheduled"
  );
}

export function isNote(post: DashboardPost) {
  return post.tags.some((tag) => tag.name === "notes");
}

export function postHref(post: DashboardPost) {
  return isNote(post)
    ? `/blog?tag=notes&note=${encodeURIComponent(post.slug)}`
    : `/blog/${post.slug}`;
}

export function getPostViews(post: DashboardPost, now: number) {
  return isPublished(post, now) ? post.viewCount : 0;
}
