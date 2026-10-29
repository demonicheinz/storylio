"use client";

import { useId } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type TimelinePoint = { date: string; label: string; views: number };

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value?: number | string; payload?: TimelinePoint }>;
}) {
  const point = payload?.[0];
  return (
    <div role="status" aria-live="polite" aria-atomic="true">
      {active && point && (
        <div className="bg-popover px-3 py-2 border border-border rounded-md text-popover-foreground text-xs">
          <p>{point.payload?.date}</p>
          <p className="mt-1 font-semibold tabular-nums">
            {Number(point.value ?? 0).toLocaleString("en-US")} views
          </p>
        </div>
      )}
    </div>
  );
}

export function ViewsTimelineChart({ data }: { data: TimelinePoint[] }) {
  const id = useId();
  return (
    <div className="w-full min-w-0 h-56 sm:h-64">
      <AreaChart
        responsive
        accessibilityLayer
        data={data}
        aria-label="Daily content views over 30 UTC calendar days"
        title="Daily content views"
        desc="Use left and right arrow keys to explore dates, or open View daily values below."
        margin={{ left: -20, right: 8, top: 8 }}
        style={{ width: "100%", height: "100%" }}
      >
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.25} />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid
          stroke="var(--border)"
          strokeDasharray="3 3"
          vertical={false}
        />
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          minTickGap={32}
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
        />
        <YAxis
          allowDecimals={false}
          axisLine={false}
          tickLine={false}
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          tickFormatter={(value) =>
            Intl.NumberFormat("en-US", { notation: "compact" }).format(value)
          }
        />
        <Tooltip
          content={<ChartTooltip />}
          isAnimationActive={false}
          cursor={{ stroke: "var(--border-hover)" }}
        />
        <Area
          type="linear"
          dataKey="views"
          name="Views"
          stroke="var(--primary)"
          strokeWidth={2}
          fill={`url(#${id})`}
          isAnimationActive={false}
          activeDot={{
            r: 4,
            fill: "var(--primary)",
            stroke: "var(--background)",
            strokeWidth: 2,
          }}
        />
      </AreaChart>
    </div>
  );
}
