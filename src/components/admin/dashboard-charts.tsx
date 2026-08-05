"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export function DashboardCharts({ data }: { data: { month: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef2f8" />
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#7f9cc7" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: "#7f9cc7" }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: "1px solid #eef2f8", fontSize: 12 }}
          cursor={{ fill: "#eefbf9" }}
        />
        <Bar dataKey="count" fill="#259e90" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
