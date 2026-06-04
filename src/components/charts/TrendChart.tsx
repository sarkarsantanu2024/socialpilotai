"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export interface TrendPoint {
  label: string;
  reach: number;
  engagement: number;
}

export function TrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="gReach" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#244fdb" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#244fdb" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gEng" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#eceef2" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#8593a8" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: "#8593a8" }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{
            borderRadius: 12,
            border: "1px solid #eceef2",
            boxShadow: "0 12px 32px rgba(16,24,40,0.12)",
            fontSize: 12,
          }}
        />
        <Area type="monotone" dataKey="reach" stroke="#244fdb" strokeWidth={2.5} fill="url(#gReach)" name="Reach" />
        <Area type="monotone" dataKey="engagement" stroke="#0ea5e9" strokeWidth={2} fill="url(#gEng)" name="Engagement" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
