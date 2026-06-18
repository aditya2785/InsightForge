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

export default function InventoryChart({
  data,
}: {
  data: {
    product: string;
    inventory: number;
  }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="product" />
        <YAxis />
        <Tooltip />
        <Bar
          dataKey="inventory"
          fill="#38bdf8"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}