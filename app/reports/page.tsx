"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Download,
  Trash2,
  Copy,
  Check,
  FileText,
} from "lucide-react";

export default function ReportsPage() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/report", {
        method: "POST",
      });

      const text = await response.text();

      if (!text) {
        throw new Error("Empty server response");
      }

      const data = JSON.parse(text);

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to generate report"
        );
      }

      setReport(data.report);
    } catch (err: any) {
      console.error(err);

      setError(
        err.message ||
          "Unable to generate report at this time."
      );
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    window.print();
  };

  const copyReport = async () => {
    if (!report) return;

    await navigator.clipboard.writeText(report);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const clearReport = () => {
    setReport("");
    setError("");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-6xl mx-auto px-8 py-10">

        {/* Logo */}
        <Link href="/dashboard">
          <h1 className="text-4xl font-bold text-blue-400 cursor-pointer hover:text-blue-300 mb-8">
            InsightForge
          </h1>
        </Link>

        {/* Hero */}
        <div className="mb-8">


          <h2 className="text-3xl font-bold tracking-tight">
            Executive Business Report
          </h2>

          <p className="text-slate-400 text-lg mt-4 max-w-3xl">
            Generate boardroom-ready business reports powered by
            forecasting, anomaly detection, and AI insights.
          </p>
        </div>

        {/* Controls */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8 no-print">
          <div className="flex items-center justify-between flex-wrap gap-4">

            {/* Left */}
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={generateReport}
                disabled={loading}
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition flex items-center gap-2"
              >
                <FileText size={18} />
                {loading
                  ? "Generating..."
                  : "Generate Report"}
              </button>

              <button
                onClick={downloadPDF}
                disabled={!report}
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition flex items-center gap-2"
              >
                <Download size={18} />
                Download PDF
              </button>


            </div>

            {/* Right */}
            <button
              onClick={clearReport}
              disabled={!report}
              className="px-6 py-3 rounded-xl bg-red-600/90 hover:bg-red-600 disabled:opacity-50 transition flex items-center gap-2"
            >
              <Trash2 size={18} />
              Clear
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center">
            <div className="animate-pulse">
              <h3 className="text-2xl font-semibold mb-3">
                Generating Executive Report
              </h3>

              <p className="text-slate-400">
                Analyzing forecasts, revenue trends,
                inventory metrics, customers, and risks...
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 mb-6">
            <h3 className="text-red-400 font-semibold mb-2">
              Report Generation Failed
            </h3>

            <p className="text-slate-300">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !report && !error && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center">
            <h2 className="text-2xl font-semibold mb-3">
              No Report Generated Yet
            </h2>

            <p className="text-slate-400">
              Click Generate Report to create an AI-powered
              executive business analysis.
            </p>
          </div>
        )}
{/* Report */}
{report && (
  <div
    id="report-pdf"
    className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden"
  >
    <div className="border-b border-slate-800 px-8 py-5">
      <Link href="/dashboard">
        <h1 className="text-2xl font-bold text-blue-400 cursor-pointer hover:text-blue-300 transition-colors">
          InsightForge
        </h1>
      </Link>

      <div className="flex items-center gap-3 mt-2 flex-wrap">
        <h2 className="font-semibold text-xl">
          Executive Business Report
        </h2>

        <button
          onClick={copyReport}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition no-print"
          title="Copy Report"
        >
          {copied ? (
            <Check size={16} />
          ) : (
            <Copy size={16} />
          )}
        </button>

        <div className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
          Ready
        </div>
      </div>

      <p className="text-slate-400 text-sm mt-2">
        Generated on {new Date().toLocaleString()}
      </p>
    </div>

    <div className="p-10">
      <div className="prose prose-invert max-w-none whitespace-pre-wrap text-slate-200">
        {report}
      </div>
    </div>
  </div>
)}
      </div>
    </div>
  );
}