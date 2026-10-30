import { CollectionPagination } from "@/components/common/collection-pagination";
import type { getProjectPagination } from "@/lib/project-pagination";

export function ProjectsPagination({
  pagination,
}: {
  pagination: ReturnType<typeof getProjectPagination>;
}) {
  return <CollectionPagination pagination={pagination} />;
}
