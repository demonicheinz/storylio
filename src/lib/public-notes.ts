import { HOME_NOTES_TAG } from "@/lib/home-content";
import { getNoteRow, getWritingFacets } from "@/lib/public-writing-cache";

export async function getPublicNote(rawSlug?: string) {
  const slug = rawSlug?.trim();
  if (!slug) return null;
  const facets = await getWritingFacets();
  const note = facets.find(
    (row) => row.slug === slug && row.tags.includes(HOME_NOTES_TAG),
  );
  return note ? getNoteRow(note.id) : null;
}
