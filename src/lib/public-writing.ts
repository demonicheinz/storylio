import { getPagination } from "@/lib/archive-pagination";
import { HOME_NOTES_TAG } from "@/lib/home-content";
import { getWritingFacets, getWritingRows } from "@/lib/public-writing-cache";
import { getWritingTag } from "@/lib/writing-filters";

export async function getPublicWriting(
  rawTag: string | undefined,
  requestedPage: number,
) {
  const facets = await getWritingFacets();
  const selectedTag = getWritingTag(rawTag);
  const kind = selectedTag === HOME_NOTES_TAG ? "notes" : "writing";
  const pool = facets.filter(
    (row) => row.tags.includes(HOME_NOTES_TAG) === (kind === "notes"),
  );
  const tags = [
    ...new Set(
      facets
        .filter((row) => !row.tags.includes(HOME_NOTES_TAG))
        .flatMap((row) => row.tags),
    ),
  ].sort((a, b) => a.localeCompare(b));
  const valid =
    !selectedTag ||
    selectedTag === HOME_NOTES_TAG ||
    tags.includes(selectedTag);
  const totalResults = valid
    ? pool.filter(
        (row) =>
          kind === "notes" || !selectedTag || row.tags.includes(selectedTag),
      ).length
    : 0;
  const page =
    Number.isSafeInteger(requestedPage) && requestedPage > 0
      ? requestedPage
      : 1;
  const pagination = getPagination(page, totalResults);
  const posts = totalResults
    ? await getWritingRows(
        kind,
        kind === "notes" ? undefined : selectedTag,
        pagination.page,
      )
    : [];
  return {
    posts,
    tags,
    kind,
    pagination,
    totalResults,
    totalPosts: pool.length,
    selectedTag,
  };
}
