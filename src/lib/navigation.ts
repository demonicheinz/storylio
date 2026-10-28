export function getPublicNavIndex(
  pathname: string,
  hrefs: readonly string[],
): number {
  const path = pathname
    .replace(/^\/preview\/posts(?=\/|$)/, "/blog")
    .replace(/^\/preview\/projects(?=\/|$)/, "/projects");

  return hrefs.findIndex((href) =>
    href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`),
  );
}
