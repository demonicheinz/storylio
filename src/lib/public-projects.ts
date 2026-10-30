import { normalizeProjectTechnologies } from "@/lib/project-filters";
import { getProjectPagination } from "@/lib/project-pagination";
import {
  getProjectCount,
  getProjectFacets,
  getProjectRows,
} from "@/lib/public-project-cache";

export async function getPublicProjects(
  selectedTechnologies: string[],
  requestedPage: number,
) {
  const facets = await getProjectFacets();
  const selected = normalizeProjectTechnologies(selectedTechnologies);
  const knownTechnologies = new Set(facets.technologies);
  const valid = selected.every((technology) =>
    knownTechnologies.has(technology),
  );
  // Unknown filters must stay empty without entering a user-keyed cache.
  const totalResults = valid ? await getProjectCount(selected) : 0;
  const page =
    Number.isSafeInteger(requestedPage) && requestedPage > 0
      ? requestedPage
      : 1;
  const pagination = getProjectPagination(page, totalResults);
  const projects = totalResults
    ? await getProjectRows(selected, pagination.page)
    : [];
  return { ...facets, projects, totalResults, pagination };
}
