export function getWritingTag(value?: string | readonly string[]) {
  const tag = typeof value === "string" ? value : value?.[0];
  return tag?.trim() || undefined;
}

export function buildWritingFilterHref(
  pathname: string,
  search: string,
  tag?: string,
) {
  const params = new URLSearchParams(search);
  params.delete("tag");
  params.delete("page");
  params.delete("note");
  if (tag) params.set("tag", tag);
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}
