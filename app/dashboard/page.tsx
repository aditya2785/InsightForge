"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import SalesAnalytics from "@/components/analytics/SalesAnalytics";
import InventoryAnalytics from "@/components/analytics/InventoryAnalytics";
import CustomerAnalytics from "@/components/analytics/CustomerAnalytics";
import type { BusinessRow } from "@/lib/types";

type DashboardTab = "sales" | "inventory" | "customers";

export default function DashboardPage() {
  const [salesRows, setSalesRows] = useState<BusinessRow[]>([]);
  const [customerRows, setCustomerRows] = useState<BusinessRow[]>([]);
  const [inventoryRows, setInventoryRows] = useState<BusinessRow[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<DashboardTab>("sales");

  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await fetch("/api/dashboard");
      const result = await response.json();

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (result.success) {
        setSalesRows(
          Array.isArray(result.salesRows) ? result.salesRows : []
        );
        setCustomerRows(
          Array.isArray(result.customerRows) ? result.customerRows : []
        );
        setInventoryRows(
          Array.isArray(result.inventoryRows) ? result.inventoryRows : []
        );
      }
    } catch (error) {
      console.error("Dashboard Error:", error);
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      fetchDashboardData();
    });
  }, [fetchDashboardData]);

  const totalRevenue = salesRows.reduce(
    (sum, row) => sum + Number(row.Sales ?? 0),
    0
  );

  const totalOrders = new Set(
    salesRows.map((row) => row["Order ID"])
  ).size;

  const totalCustomers =
    customerRows.length > 0
      ? customerRows.length
      : new Set(
          salesRows.map((row) => row["Customer ID"])
        ).size;

  const totalProducts =
    inventoryRows.length > 0
      ? inventoryRows.length
      : new Set(
          salesRows.map((row) => row["Product ID"])
        ).size;

  const revenueByMonth: Record<string, number> = {};

  salesRows.forEach((row) => {
    const date = row["Order Date"];

    if (!date) return;

    const month = new Date(String(date)).toLocaleString("default", {
      month: "short",
    });

    revenueByMonth[month] =
      (revenueByMonth[month] || 0) + Number(row.Sales || 0);
  });

  const chartData = Object.keys(revenueByMonth).map((month) => ({
    month,
    revenue: revenueByMonth[month],
  }));

  const productRevenue: Record<string, number> = {};

  salesRows.forEach((row) => {
    const product = String(
      row["Product Name"] ||
      row["Product"] ||
      "Unknown Product"
    );

    productRevenue[product] =
      (productRevenue[product] || 0) + Number(row.Sales ?? 0);
  });

  const topProducts = Object.entries(productRevenue)
    .map(([product, revenue]) => ({
      product,
      revenue,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const generateInsights = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/insights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          revenue: totalRevenue,
          orders: totalOrders,
          customers: totalCustomers,
          products: totalProducts,
          topProducts,
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      setAiInsights(
        data.insights ?? data.error ?? "No insights returned."
      );
    } catch (error) {
      console.error(error);
      setAiInsights("Unable to generate AI insights.");
    } finally {
      setLoading(false);
    }
  };

  if (dashboardLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-8 flex items-center justify-center">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      <aside className="w-60 border-r border-slate-800 p-6">
        <Link href="/">
          <h1 className="text-2xl font-bold text-blue-400 block cursor-pointer hover:text-blue-300">
            InsightForge
          </h1>
        </Link>

        <nav className="space-y-5 mt-8">
          <Link href="/dashboard" className="block cursor-pointer hover:text-blue-400">
            Dashboard
          </Link>
          <Link href="/upload" className="block cursor-pointer hover:text-blue-400">
            Upload Data
          </Link>
          <Link href="/forecasts" className="block cursor-pointer hover:text-blue-400">
            Forecasts
          </Link>
          <Link href="/reports" className="block cursor-pointer hover:text-blue-400">
            Reports
          </Link>
          <Link href="/settings" className="block cursor-pointer hover:text-blue-400">
            Settings
          </Link>
        </nav>
      </aside>

      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">
              Business Overview
            </h1>
            <p className="text-slate-400 mt-2">
              Monitor business performance and AI insights.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={generateInsights}
              className="bg-slate-800 px-4 py-2 rounded-lg hover:bg-slate-700"
            >
              AI Insights
            </button>

            <Link
              href="/reports"
              className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Generate Report
            </Link>
          </div>
        </div>

        {loading && (
          <div className="bg-slate-900 p-6 rounded-xl mb-6">
            Generating AI insights...
          </div>
        )}

        {aiInsights && (
          <div className="bg-slate-900 p-6 rounded-xl mb-6">
            <h2 className="text-2xl font-bold mb-4">
              AI Analysis
            </h2>
            <pre className="whitespace-pre-wrap">
              {aiInsights}
            </pre>
          </div>
        )}

        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab("sales")}
            className={`px-5 py-2 rounded-lg transition ${
              activeTab === "sales"
                ? "bg-blue-600"
                : "bg-slate-900 hover:bg-slate-800"
            }`}
          >
            Sales
          </button>

          <button
            onClick={() => setActiveTab("inventory")}
            className={`px-5 py-2 rounded-lg transition ${
              activeTab === "inventory"
                ? "bg-blue-600"
                : "bg-slate-900 hover:bg-slate-800"
            }`}
          >
            Inventory
          </button>

          <button
            onClick={() => setActiveTab("customers")}
            className={`px-5 py-2 rounded-lg transition ${
              activeTab === "customers"
                ? "bg-blue-600"
                : "bg-slate-900 hover:bg-slate-800"
            }`}
          >
            Customers
          </button>
        </div>

        {activeTab === "sales" && (
          <SalesAnalytics
            totalRevenue={totalRevenue}
            totalOrders={totalOrders}
            totalProducts={totalProducts}
            totalCustomers={totalCustomers}
            chartData={chartData}
            topProducts={topProducts}
          />
        )}

        {activeTab === "inventory" && (
          <InventoryAnalytics inventoryRows={inventoryRows} />
        )}

        {activeTab === "customers" && (
          <CustomerAnalytics customerRows={customerRows} />
        )}
      </main>
    </div>
  );
}
