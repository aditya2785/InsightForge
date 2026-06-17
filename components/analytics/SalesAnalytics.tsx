import RevenueChart from "@/components/charts/RevenueChart";
import type { ChartPoint, TopProduct } from "@/lib/types";

type SalesAnalyticsProps = {
  totalRevenue: number | null;
  totalOrders: number;
  totalProducts: number | null;
  totalCustomers: number | null;
  chartData: ChartPoint[];
  topProducts: TopProduct[];
  revenueAvailable: boolean;
  productAvailable: boolean;
};

export default function SalesAnalytics({
  totalRevenue,
  totalOrders,
  totalProducts,
  totalCustomers,
  chartData,
  topProducts,
  revenueAvailable,
  productAvailable,
}: SalesAnalyticsProps) {
  return (
    <>
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-900 p-6 rounded-xl">
          <h3>Revenue</h3>
          <p className="text-3xl font-bold">
            {totalRevenue === null
              ? "Unavailable"
              : `Rs. ${totalRevenue.toLocaleString()}`}
          </p>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl">
          <h3>Orders</h3>
          <p className="text-3xl font-bold">
            {totalOrders}
          </p>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl">
          <h3>Products</h3>
          <p className="text-3xl font-bold">
            {totalProducts === null ? "Unavailable" : totalProducts}
          </p>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl">
          <h3>Customers</h3>
          <p className="text-3xl font-bold">
            {totalCustomers === null ? "Unavailable" : totalCustomers}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-4">
            Revenue Analytics
          </h2>

          {revenueAvailable && chartData.length > 0 ? (
            <RevenueChart data={chartData} />
          ) : (
            <p className="text-slate-400">
              Revenue data unavailable.
            </p>
          )}
        </div>

        <div className="bg-slate-900 rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-6">
            Top Products
          </h2>

          {productAvailable && topProducts.length > 0 ? (
            topProducts.map((product, index) => (
              <div
                key={index}
                className="flex justify-between border-b border-slate-700 py-3"
              >
                <span>{product.product}</span>

                <span>
                  Rs. {product.revenue.toLocaleString()}
                </span>
              </div>
            ))
          ) : (
            <p className="text-slate-400">
              No product data available.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
