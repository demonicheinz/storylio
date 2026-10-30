import { cacheLife, cacheTag } from "next/cache";
import { renderMDX } from "@/lib/mdx";
import { PUBLIC_CACHE_TAGS } from "@/lib/public-cache-tags";

export async function renderPublicMDX(
  content: string,
  type: "post" | "project",
) {
  "use cache";
  cacheLife("minutes");
  cacheTag(
    type === "post" ? PUBLIC_CACHE_TAGS.posts : PUBLIC_CACHE_TAGS.projects,
  );
  return renderMDX(content);
}
