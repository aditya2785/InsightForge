"use client";

import { useState } from "react";

export default function ReportsPage() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState("");

  const generateReport = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/report", {
        method: "POST",
      });

      const data = await response.json();

      setReport(data.report);
    } catch (error) {
      console.error(error);
    }

    setLoading(false);
  };

  const downloadPDF = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">
          Executive Business Report
        </h1>

        <p className="text-slate-400 mb-8">
          AI-powered strategic business intelligence report
        </p>

        <div className="flex gap-4 mb-8">
          <button
            onClick={generateReport}
            className="bg-blue-600 px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Generate Report
          </button>

          {report && (
            <button
              onClick={downloadPDF}
              className="bg-green-600 px-6 py-3 rounded-lg hover:bg-green-700"
            >
              Download PDF
            </button>
          )}
        </div>

        {loading && (
          <div className="bg-slate-900 p-6 rounded-xl">
            Generating Executive Report...
          </div>
        )}

        {report && (
          <div className="bg-slate-900 rounded-xl p-8 border border-slate-800">
            <div className="prose prose-invert max-w-none whitespace-pre-wrap">
              {report}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}