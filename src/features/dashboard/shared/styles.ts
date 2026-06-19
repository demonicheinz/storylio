export const dashboardStyles = {
  page: "flex min-w-0 flex-col gap-5",
  header: "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
  statGrid: "grid grid-cols-2 gap-3 xl:grid-cols-4",
  statCard: "min-w-0 border-border/70 bg-card/55 py-4 shadow-sm",
  statContent: "flex items-center gap-3 px-4",
  statIcon: "flex size-10 shrink-0 items-center justify-center rounded-2xl",
  surface: "min-w-0 border-border/70 bg-card/55",
  toolbarCard: "min-w-0 overflow-hidden border-border/70 bg-card/55 py-0",
  toolbarContent: "min-w-0 p-3 sm:p-4",
  listSurface:
    "min-w-0 overflow-hidden rounded-2xl border border-border/70 bg-background/30",
  listHeader:
    "border-b border-border/60 px-3 py-3 text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase",
  listRows: "divide-y divide-border/60",
  sortableRows: "flex min-w-0 flex-col gap-3",
  listRow:
    "overflow-hidden rounded-2xl border border-border/70 bg-background/30 transition-[border-color,box-shadow,opacity]",
  nestedPanel: "rounded-2xl border border-border/60 bg-background/30 p-4",
  emptyState:
    "flex min-h-72 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border/70 bg-background/30 p-6 text-center",
  gridCards: "grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4",
} as const;
