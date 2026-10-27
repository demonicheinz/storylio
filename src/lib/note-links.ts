export function buildNotePermalink(slug: string) {
  const params = new URLSearchParams({ tag: "notes", note: slug });
  return `/blog?${params}`;
}

export function buildNoteHref(
  pathname: string,
  search: string,
  slug?: string,
  hash = "",
) {
  const params = new URLSearchParams(search);
  params.delete("note");
  if (slug) params.set("note", slug);
  const query = params.toString();
  return `${pathname}${query ? `?${query}` : ""}${hash}`;
}
