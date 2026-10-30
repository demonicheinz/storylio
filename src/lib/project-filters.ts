/** Canonical order also gives equivalent stack combinations one cache key. */
export function normalizeProjectTechnologies(
  value?: string | readonly string[],
) {
  return [
    ...new Set(
      (typeof value === "string" ? [value] : (value ?? []))
        .map((tech) => tech.trim())
        .filter(Boolean),
    ),
  ].sort();
}

export function buildProjectFilterHref(
  pathname: string,
  search: string,
  technologies: readonly string[],
) {
  const params = new URLSearchParams(search);
  params.delete("tech");
  params.delete("page");
  for (const tech of normalizeProjectTechnologies(technologies))
    params.append("tech", tech);
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}
