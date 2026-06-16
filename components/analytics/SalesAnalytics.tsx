import RevenueChart from "@/components/charts/RevenueChart";
import type { ChartPoint, TopProduct } from "@/lib/types";

type SalesAnalyticsProps = {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  chartData: ChartPoint[];
  topProducts: TopProduct[];
};

export default function SalesAnalytics({
  totalRevenue,
  totalOrders,
  totalProducts,
  totalCustomers,
  chartData,
  topProducts,
}: SalesAnalyticsProps) {
  return (
    <>
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-900 p-6 rounded-xl">
          <h3>Revenue</h3>
          <p className="text-3xl font-bold">
            Rs. {totalRevenue.toLocaleString()}
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
            {totalProducts}
          </p>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl">
          <h3>Customers</h3>
          <p className="text-3xl font-bold">
            {totalCustomers}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-4">
            Revenue Analytics
          </h2>

          <RevenueChart data={chartData} />
        </div>

        <div className="bg-slate-900 rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-6">
            Top Products
          </h2>

          {topProducts.map((product, index) => (
            <div
              key={index}
              className="flex justify-between border-b border-slate-700 py-3"
            >
              <span>{product.product}</span>

              <span>
                Rs. {product.revenue.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
