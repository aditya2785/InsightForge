"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import SalesAnalytics from "@/components/analytics/SalesAnalytics";
import InventoryAnalytics from "@/components/analytics/InventoryAnalytics";
import CustomerAnalytics from "@/components/analytics/CustomerAnalytics";
import BusinessHealthScoreCard from "@/components/dashboard/BusinessHealthScoreCard";
import ForecastCenter from "@/components/dashboard/ForecastCenter";
import RiskCenter from "@/components/dashboard/RiskCenter";
import type {
  AnomalyDTO,
  BusinessHealthScoreDTO,
  BusinessRow,
  ForecastDTO,
} from "@/lib/types";
import {
  getMappedNumber,
  getMappedValue,
  type ColumnMapping,
} from "@/lib/analytics/column-mapper";
import { getFieldNumber } from "@/lib/analytics/dataset-utils";

type DashboardTab = "sales" | "inventory" | "customers";

type DatasetMetadata = {
  sales: {
    mapping: ColumnMapping;
  } | null;
  customers: {
    mapping: ColumnMapping;
  } | null;
  inventory: {
    mapping: ColumnMapping;
  } | null;
};

export default function DashboardPage() {
  const [salesRows, setSalesRows] = useState<BusinessRow[]>([]);
  const [customerRows, setCustomerRows] = useState<BusinessRow[]>([]);
  const [inventoryRows, setInventoryRows] = useState<BusinessRow[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState("");
  const [loading, setLoading] = useState(false);
const [activeTab, setActiveTab] =
  useState<DashboardTab>("sales");

  const [healthScore, setHealthScore] =
    useState<BusinessHealthScoreDTO | null>(null);
  const [forecasts, setForecasts] = useState<ForecastDTO[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyDTO[]>([]);
  const [datasetMetadata, setDatasetMetadata] =
    useState<DatasetMetadata>({
      sales: null,
      customers: null,
      inventory: null,
    });

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
        setHealthScore(result.healthScore ?? null);
        setForecasts(
          Array.isArray(result.forecasts) ? result.forecasts : []
        );
        setAnomalies(
          Array.isArray(result.anomalies) ? result.anomalies : []
        );
        setDatasetMetadata(result.datasetMetadata ?? {
          sales: null,
          customers: null,
          inventory: null,
        });
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

  const salesMapping = datasetMetadata.sales?.mapping ?? {};
  const customerMapping = datasetMetadata.customers?.mapping ?? {};
  const inventoryMapping = datasetMetadata.inventory?.mapping ?? {};
  const hasSalesData = salesRows.length > 0;
const hasInventoryData = inventoryRows.length > 0;
const hasCustomerData = customerRows.length > 0;

useEffect(() => {
  if (hasSalesData && activeTab !== "sales") return;
  if (hasInventoryData && activeTab === "inventory") return;
  if (hasCustomerData && activeTab === "customers") return;

  if (hasSalesData) {
    setActiveTab("sales");
  } else if (hasInventoryData) {
    setActiveTab("inventory");
  } else if (hasCustomerData) {
    setActiveTab("customers");
  }
}, [
  hasSalesData,
  hasInventoryData,
  hasCustomerData,
]);

  const hasRevenue =
  Boolean(salesMapping.revenue) ||
  (Boolean(salesMapping.price) &&
    Boolean(salesMapping.quantity));
  const hasProduct = Boolean(salesMapping.product);
  const hasCustomer =
    Boolean(customerMapping.customer) ||
    Boolean(salesMapping.customer);
  const totalRevenue = hasRevenue
    ? salesRows.reduce(
        (sum, row) =>
          sum +
          (getFieldNumber(
            row,
            salesMapping,
            "revenue"
          ) ?? 0),
        0
      )
    : null;

  const totalOrders = salesRows.length;

  const totalCustomers =
    customerRows.length > 0 && customerMapping.customer
      ? customerRows.length
      : hasCustomer
      ? new Set(
          salesRows
            .map((row) => getMappedValue(row, salesMapping, "customer"))
            .filter(Boolean)
            .map(String)
        ).size
      : null;

  const totalProducts = hasProduct
  ? new Set(
      salesRows
        .map((row) =>
          getMappedValue(row, salesMapping, "product")
        )
        .filter(Boolean)
        .map(String)
    ).size
  : null;

  const revenueByMonth: Record<string, number> = {};

  if (hasRevenue && salesMapping.date) {
    salesRows.forEach((row) => {
      const dateValue = getMappedValue(row, salesMapping, "date");
      const revenue = getFieldNumber(row, salesMapping, "revenue");

      if (!dateValue || revenue === null) return;

      const month = new Date(String(dateValue)).toLocaleString("default", {
        month: "short",
      });

      revenueByMonth[month] =
        (revenueByMonth[month] || 0) + revenue;
    });
  }

  const chartData = Object.keys(revenueByMonth).map((month) => ({
    month,
    revenue: revenueByMonth[month],
  }));

  const productRevenue: Record<string, number> = {};

  if (hasProduct && hasRevenue) {
    salesRows.forEach((row) => {
      const productValue = getMappedValue(row, salesMapping, "product");
      const revenue = getFieldNumber(row, salesMapping, "revenue");

      if (!productValue || revenue === null) return;

      const product = String(productValue);

      productRevenue[product] =
        (productRevenue[product] || 0) + revenue;
    });
  }

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
          forecasts,
          anomalies,
          healthScore,
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

if (!hasSalesData && !hasInventoryData && !hasCustomerData) {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">
          No Business Data Uploaded
        </h1>

        <p className="text-slate-400 mb-6">
          Upload sales, inventory, or customer data to start generating insights.
        </p>

        <Link
          href="/upload"
          className="bg-blue-600 px-5 py-3 rounded-lg hover:bg-blue-700"
        >
          Upload Data
        </Link>
      </div>
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
{(!hasSalesData || !hasInventoryData || !hasCustomerData) && (
  <div className="grid md:grid-cols-3 gap-4 mb-6">

    {!hasSalesData && (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="font-semibold text-lg">
          Sales Data Missing
        </h3>

        <p className="text-slate-400 mt-2">
          Upload sales data to unlock:
        </p>

        <ul className="mt-2 text-sm text-slate-400">
          <li>• Revenue Trends</li>
          <li>• Forecasting</li>
          <li>• Demand Prediction</li>
        </ul>

        <Link
          href="/upload"
          className="inline-block mt-4 text-blue-400 hover:text-blue-300"
        >
          Upload Sales Data →
        </Link>
      </div>
    )}

    {!hasInventoryData && (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="font-semibold text-lg">
          Inventory Data Missing
        </h3>

        <p className="text-slate-400 mt-2">
          Upload inventory data to unlock:
        </p>

        <ul className="mt-2 text-sm text-slate-400">
          <li>• Inventory Health</li>
          <li>• Stock Risk Detection</li>
          <li>• Reorder Planning</li>
        </ul>

        <Link
          href="/upload"
          className="inline-block mt-4 text-blue-400 hover:text-blue-300"
        >
          Upload Inventory Data →
        </Link>
      </div>
    )}

    {!hasCustomerData && (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="font-semibold text-lg">
          Customer Data Missing
        </h3>

        <p className="text-slate-400 mt-2">
          Upload customer data to unlock:
        </p>

        <ul className="mt-2 text-sm text-slate-400">
          <li>• Customer Analytics</li>
          <li>• Segmentation</li>
          <li>• Churn Insights</li>
        </ul>

        <Link
          href="/upload"
          className="inline-block mt-4 text-blue-400 hover:text-blue-300"
        >
          Upload Customer Data →
        </Link>
      </div>
    )}

  </div>
)}
        <BusinessHealthScoreCard healthScore={healthScore} />

        <ForecastCenter forecasts={forecasts} />

        <RiskCenter anomalies={anomalies} healthScore={healthScore}/>

        <div className="flex gap-4 mb-8">
        {hasSalesData && (
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
        )}
        {hasInventoryData && (
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
        )}
        {hasCustomerData && (
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
        )}
        </div>

        {hasSalesData && activeTab === "sales" && (
          <SalesAnalytics
            totalRevenue={totalRevenue}
            totalOrders={totalOrders}
            totalProducts={totalProducts}
            totalCustomers={totalCustomers}
            chartData={chartData}
            topProducts={topProducts}
            revenueAvailable={hasRevenue}
            productAvailable={hasProduct}
          />
        )}

{hasInventoryData && activeTab === "inventory" && (
  <InventoryAnalytics
    inventoryRows={inventoryRows}
    inventoryAvailable={Boolean(inventoryMapping.inventory)}
    mapping={inventoryMapping}
  />
)}

{hasCustomerData && activeTab === "customers" && (
  <CustomerAnalytics
    customerRows={customerRows}
    customerAvailable={hasCustomer}
    mapping={customerMapping}
  />
)}
      </main>
    </div>
  );
}
