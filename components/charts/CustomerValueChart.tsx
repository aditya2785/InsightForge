"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function CustomerValueChart({
  data,
}: {
  data: {
    customer: string;
    revenue: number;
  }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="customer" />
        <YAxis />
        <Tooltip />
        <Bar
          dataKey="revenue"
          fill="#38bdf8"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}