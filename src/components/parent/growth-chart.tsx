"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

type GrowthRecord = {
  id: string;
  date: string;
  weightKg: number;
  heightCm: number;
  ageInWeeks: number;
};

type Props = {
  records: GrowthRecord[];
};

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-card p-3 shadow-lg text-sm">
      <p className="font-semibold mb-2 text-foreground">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: p.color }}
          />
          <span className="text-muted-foreground capitalize">{p.name}:</span>
          <span className="font-medium text-foreground">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function GrowthChart({ records }: Props) {
  const data = records.map((r) => ({
    date: r.date,
    age: `${r.ageInWeeks}w`,
    weight: r.weightKg,
    height: r.heightCm,
  }));

  if (data.length === 0) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Weight Chart */}
      <div>
        <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
          Weight (kg)
        </h4>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(213 94% 48%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(213 94% 48%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 91%)" />
            <XAxis
              dataKey="age"
              tick={{ fontSize: 11, fill: "hsl(215 16% 47%)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "hsl(215 16% 47%)" }}
              axisLine={false}
              tickLine={false}
              domain={["dataMin - 0.5", "dataMax + 0.5"]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="weight"
              name="weight (kg)"
              stroke="hsl(213 94% 48%)"
              strokeWidth={2.5}
              fill="url(#weightGradient)"
              dot={{ fill: "hsl(213 94% 48%)", r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Height Chart */}
      <div>
        <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
          Height (cm)
        </h4>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="heightGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(217 91% 60%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(217 91% 60%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 91%)" />
            <XAxis
              dataKey="age"
              tick={{ fontSize: 11, fill: "hsl(215 16% 47%)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "hsl(215 16% 47%)" }}
              axisLine={false}
              tickLine={false}
              domain={["dataMin - 2", "dataMax + 2"]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="height"
              name="height (cm)"
              stroke="hsl(217 91% 60%)"
              strokeWidth={2.5}
              fill="url(#heightGradient)"
              dot={{ fill: "hsl(217 91% 60%)", r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
