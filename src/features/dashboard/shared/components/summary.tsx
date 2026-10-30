export function DashboardSummary({
  items,
}: {
  items: ReadonlyArray<{
    label: string;
    value: number | string;
    description?: string;
  }>;
}) {
  return (
    <dl className="flex flex-wrap gap-x-6 gap-y-3 pb-4 border-border border-b">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex flex-wrap items-baseline gap-x-2 gap-y-1 min-w-0"
        >
          <dt className="text-muted-foreground text-sm">{item.label}</dt>
          <dd className="font-semibold tabular-nums text-sm">{item.value}</dd>
          {item.description && (
            <dd className="text-muted-foreground text-xs">
              {item.description}
            </dd>
          )}
        </div>
      ))}
    </dl>
  );
}
