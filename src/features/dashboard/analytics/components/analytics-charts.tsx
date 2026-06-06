"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type TimelinePoint = {
  date: string;
  label: string;
  views: number;
};

type RankingPoint = {
  name: string;
  shortName: string;
  views: number;
};

type ChartTooltipProps = {
  active?: boolean;
  label?: string | number;
  payload?: Array<{
    color?: string;
    payload?: TimelinePoint | RankingPoint;
    value?: number | string;
  }>;
};

const chartColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function ChartTooltip({ active, label, payload }: ChartTooltipProps) {
  const item = payload?.[0];

  if (!active || !item) {
    return null;
  }

  const itemPayload = item.payload;
  const title =
    itemPayload && "name" in itemPayload
      ? itemPayload.name
      : itemPayload && "date" in itemPayload
        ? itemPayload.date
        : label;

  return (
    <div className="border-border-hover min-w-40 rounded-xl border bg-card px-4 py-3 text-card-foreground shadow-2xl">
      <p className="max-w-64 text-xs leading-5 font-medium">{title}</p>
      <div className="mt-2 flex items-center justify-between gap-6 text-sm">
        <span className="flex items-center gap-2 text-muted-foreground">
          <span
            className="size-2.5 rounded-full"
            style={{ backgroundColor: item.color ?? "var(--chart-2)" }}
          />
          Views
        </span>
        <span className="font-semibold text-foreground">
          {Number(item.value ?? 0).toLocaleString("en-US")}
        </span>
      </div>
    </div>
  );
}

export function ViewsTimelineChart({ data }: { data: TimelinePoint[] }) {
  return (
    <div className="h-64 min-h-64 w-full min-w-0">
      <AreaChart
        responsive
        data={data}
        margin={{ left: -20, right: 12, top: 8 }}
        style={{ width: "100%", height: "100%" }}
      >
        <defs>
          <linearGradient id="views-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.7} />
            <stop offset="45%" stopColor="var(--chart-2)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--chart-5)" stopOpacity={0.04} />
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
          minTickGap={28}
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
        />
        <YAxis
          allowDecimals={false}
          axisLine={false}
          tickLine={false}
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
        />
        <Tooltip
          content={<ChartTooltip />}
          cursor={{ stroke: "var(--border-hover)" }}
        />
        <Area
          type="monotone"
          dataKey="views"
          name="Views"
          stroke="var(--chart-2)"
          strokeWidth={2}
          fill="url(#views-gradient)"
          activeDot={{
            r: 5,
            fill: "var(--chart-2)",
            stroke: "var(--primary-foreground)",
            strokeWidth: 2,
          }}
        />
      </AreaChart>
    </div>
  );
}

export function ContentRankingChart({ data }: { data: RankingPoint[] }) {
  return (
    <div className="h-64 min-h-64 w-full min-w-0">
      <BarChart
        responsive
        data={data}
        layout="vertical"
        margin={{ bottom: 4, left: 4, right: 28, top: 4 }}
        style={{ width: "100%", height: "100%" }}
      >
        <CartesianGrid
          stroke="var(--border)"
          strokeDasharray="3 3"
          horizontal={false}
        />
        <XAxis
          type="number"
          allowDecimals={false}
          axisLine={false}
          tickLine={false}
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
        />
        <YAxis
          type="category"
          dataKey="shortName"
          width={132}
          axisLine={false}
          tickLine={false}
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
        />
        <Tooltip
          content={<ChartTooltip />}
          cursor={{ fill: "var(--muted)", fillOpacity: 0.45 }}
        />
        <Bar dataKey="views" name="Views" radius={[0, 8, 8, 0]}>
          {data.map((item, index) => (
            <Cell
              key={item.name}
              fill={chartColors[index % chartColors.length]}
            />
          ))}
        </Bar>
      </BarChart>
    </div>
  );
}
