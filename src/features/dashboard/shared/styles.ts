export const dashboardStyles = {
  page: "flex min-w-0 flex-col gap-6",
  header: "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
  statGrid: "grid grid-cols-2 gap-3 xl:grid-cols-4",
  statCard: "py-4",
  statContent: "flex items-center gap-3 px-4",
  statIcon: "flex size-10 shrink-0 items-center justify-center rounded-md",
  surface: "min-w-0",
  toolbarCard: "min-w-0 py-0",
  toolbarContent: "min-w-0 p-3 sm:p-4",
  listSurface:
    "min-w-0 overflow-hidden rounded-lg border border-border bg-card",
  listHeader:
    "border-b border-border px-4 py-3 text-xs font-medium text-muted-foreground",
  listRows: "divide-y divide-border/60",
  sortableRows: "flex min-w-0 flex-col gap-3",
  listRow:
    "overflow-hidden rounded-lg border border-border bg-card transition-[border-color,opacity]",
  nestedPanel: "rounded-md border border-border bg-background p-4",
  emptyState:
    "flex min-h-56 flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border bg-card p-6 text-center",
  gridCards: "grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4",
} as const;
