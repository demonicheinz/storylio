export function buildGalleryFilterHref(
  pathname: string,
  search: string,
  category?: string,
) {
  const params = new URLSearchParams(search);
  params.delete("category");
  if (category) params.set("category", category);
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}
