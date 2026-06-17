"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ForecastDTO } from "@/lib/types";

type ForecastCenterProps = {
  forecasts: ForecastDTO[];
};

const forecastLabels: Record<ForecastDTO["forecastType"], string> = {
  SALES: "Sales Forecast",
  PRODUCT_DEMAND: "Product Demand Forecast",
  INVENTORY_REQUIREMENT: "Inventory Requirement Forecast",
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en", {
    month: "short",
    year: "2-digit",
  });
}

function getLatestForecast(
  forecasts: ForecastDTO[],
  type: ForecastDTO["forecastType"]
) {
  return forecasts
    .filter((forecast) => forecast.forecastType === type)
    .sort((a, b) => a.predictionDate.localeCompare(b.predictionDate))[0];
}

export default function ForecastCenter({
  forecasts,
}: ForecastCenterProps) {
  const chartData = forecasts
    .filter((forecast) => forecast.forecastType === "SALES")
    .map((forecast) => ({
      date: formatDate(forecast.predictionDate),
      value: forecast.predictedValue,
    }));

  return (
    <section className="mb-8">
      <div className="flex items-end justify-between gap-4 mb-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-slate-400">
            Forecast Center
          </p>
          <h2 className="text-2xl font-semibold">
            Forward-looking business projections
          </h2>
        </div>
      </div>

      {forecasts.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-300">
          Upload sales data to generate sales, demand, and inventory forecasts.
        </div>
      ) : (
        <div className="grid xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">
              Sales Trend Projection
            </h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    background: "#020617",
                    border: "1px solid #1e293b",
                    color: "#f8fafc",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#38bdf8"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-4">
            {(
              [
                "SALES",
                "PRODUCT_DEMAND",
                "INVENTORY_REQUIREMENT",
              ] as const
            ).map((type) => {
              const latest = getLatestForecast(forecasts, type);

              return (
                <div
                  key={type}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-5"
                >
                  <p className="text-sm text-slate-400">
                    {forecastLabels[type]}
                  </p>
                  <p className="text-3xl font-bold mt-2">
                    {latest
                      ? latest.predictedValue.toLocaleString()
                      : "No signal"}
                  </p>
                  <p className="text-sm text-slate-400 mt-2">
                    {latest
                      ? `${latest.confidenceScore}% confidence for ${formatDate(latest.predictionDate)}`
                      : "Awaiting enough uploaded history"}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
