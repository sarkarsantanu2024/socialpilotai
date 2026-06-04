"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export function BarMini({
  data,
  highlight,
}: {
  data: { label: string; value: number }[];
  highlight?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 6, right: 8, left: -20, bottom: 0 }}>
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#8593a8" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#8593a8" }} axisLine={false} tickLine={false} />
        <Tooltip
          cursor={{ fill: "#f6f7f9" }}
          contentStyle={{ borderRadius: 12, border: "1px solid #eceef2", fontSize: 12 }}
        />
        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={i === highlight ? "#244fdb" : "#bfd2ff"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
