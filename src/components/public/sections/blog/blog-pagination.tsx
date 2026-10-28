import { CollectionPagination } from "@/components/common/collection-pagination";
import type { getPagination } from "@/lib/archive-pagination";
export function BlogPagination({
  pagination,
  notes,
}: {
  pagination: ReturnType<typeof getPagination>;
  notes: boolean;
}) {
  return (
    <CollectionPagination
      pagination={pagination}
      label={notes ? "Note" : "Article"}
      noun={notes ? "notes" : "articles"}
      targetId="writing-list"
    />
  );
}
