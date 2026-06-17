"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import ForecastCenter from "@/components/dashboard/ForecastCenter";
import type { ForecastDTO } from "@/lib/types";

export default function ForecastPage() {
  const [forecasts, setForecasts] = useState<ForecastDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");

  const loadForecasts = useCallback(async () => {
    try {
      const response = await fetch("/api/forecasts");
      const result = await response.json();

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      setForecasts(
        Array.isArray(result.forecasts) ? result.forecasts : []
      );
    } catch (error) {
      console.error(error);
      setMessage("Unable to load forecasts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      loadForecasts();
    });
  }, [loadForecasts]);

  const generateForecasts = async () => {
    setGenerating(true);
    setMessage("");

    try {
      const response = await fetch("/api/forecasts/generate", {
        method: "POST",
      });
      const result = await response.json();

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      setForecasts(
        Array.isArray(result.forecasts) ? result.forecasts : []
      );
      setMessage("Forecasts generated from latest uploaded datasets.");
    } catch (error) {
      console.error(error);
      setMessage("Unable to generate forecasts.");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-8 flex items-center justify-center">
        Loading forecasts...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <Link
              href="/dashboard"
              className="text-slate-400 hover:text-white"
            >
              Back to Dashboard
            </Link>
            <h1 className="text-4xl font-bold mt-4">
              Forecasts
            </h1>
            <p className="text-slate-400 mt-2">
              Sales, demand, and inventory projections generated from your
              uploaded Aurora datasets.
            </p>
          </div>

          <button
            onClick={generateForecasts}
            disabled={generating}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 px-5 py-3 rounded-lg font-semibold"
          >
            {generating ? "Generating..." : "Generate Forecasts"}
          </button>
        </div>

        {message && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6 text-slate-300">
            {message}
          </div>
        )}

        <ForecastCenter forecasts={forecasts} />
      </div>
    </div>
  );
}
