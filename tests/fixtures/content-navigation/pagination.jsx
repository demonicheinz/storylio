import { useState } from "react";
import { DashboardPagination } from "@/features/dashboard/shared/components/pagination";
import { getPaginationState } from "@/lib/pagination";

export function PaginationFixture() {
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const state = getPaginationState(100, page, size);
  return (
    <main className="p-4 md:p-8">
      <DashboardPagination
        firstIndex={state.firstIndex}
        lastIndex={state.lastIndex}
        total={100}
        page={state.currentPage}
        pageCount={state.pageCount}
        itemsPerPage={size}
        itemsPerPageOptions={[10, 20, 40]}
        onPageChange={setPage}
        onItemsPerPageChange={(value) => {
          setSize(value);
          setPage(1);
        }}
      />
    </main>
  );
}
