import type { BusinessRow } from "@/lib/types";
import CustomerValueChart from "@/components/charts/CustomerValueChart";
import {
  getMappedNumber,
  getMappedValue,
  type ColumnMapping,
} from "@/lib/analytics/column-mapper";

export default function CustomerAnalytics({
  customerRows,
  customerAvailable,
  mapping,
}: {
  customerRows: BusinessRow[];
  customerAvailable: boolean;
  mapping: ColumnMapping;
}) {
  const totalCustomers = customerRows.length;

  const incomeValues = customerRows
    .map((row) => getMappedNumber(row, mapping, "revenue"))
    .filter((value): value is number => value !== null);

  const averageIncome =
    incomeValues.length > 0
      ? incomeValues.reduce((sum, value) => sum + value, 0) /
        incomeValues.length
      : 0;

  const highValueCustomers = incomeValues.filter(
    (income) => income > averageIncome
  ).length;

  const customerHealth =
    totalCustomers > 0
      ? Math.min(
          100,
          Math.round(
            (highValueCustomers / totalCustomers) * 100 + 50
          )
        )
      : 0;

 const topCustomers = [...customerRows]
  .sort((a, b) => {
    const incomeA =
      getMappedNumber(a, mapping, "revenue") ?? 0;
    const incomeB =
      getMappedNumber(b, mapping, "revenue") ?? 0;

    return incomeB - incomeA;
  })
  .slice(0, 5);

const customerChartData = [...customerRows]
  .sort((a, b) => {
    const incomeA =
      getMappedNumber(a, mapping, "revenue") ?? 0;
    const incomeB =
      getMappedNumber(b, mapping, "revenue") ?? 0;

    return incomeB - incomeA;
  })
  .slice(0, 10)
  .map((customer, index) => ({
    customer: String(
      getMappedValue(
        customer,
        mapping,
        "customer"
      ) ?? `Customer ${index + 1}`
    ),
    revenue:
      getMappedNumber(
        customer,
        mapping,
        "revenue"
      ) ?? 0,
  }));

  return (
    <div>
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-900 p-6 rounded-xl">
          <h3>Total Customers</h3>
          <p className="text-3xl font-bold">
            {customerAvailable
              ? totalCustomers.toLocaleString()
              : "Unavailable"}
          </p>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl">
          <h3>Average Income</h3>
          <p className="text-3xl font-bold">
            {averageIncome > 0
              ? `${averageIncome.toFixed(1)}k`
              : "N/A"}
          </p>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl">
          <h3>High Value Customers</h3>
          <p className="text-3xl font-bold">
            {highValueCustomers}
          </p>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl">
          <h3>Customer Health</h3>
          <p className="text-3xl font-bold text-green-400">
            {customerHealth}/100
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 rounded-xl p-6">
<h2 className="text-2xl font-semibold mb-4">
  Customer Value Distribution
</h2>

{customerAvailable &&
customerChartData.length > 0 ? (
  <CustomerValueChart
    data={customerChartData}
  />
) : (
  <p className="text-slate-400">
    No customer value data available.
  </p>
)}

<div className="space-y-3 text-slate-300 mt-6">
  <p>
    • Total customers analyzed:{" "}
    {totalCustomers.toLocaleString()}
  </p>

  <p>
    • Average customer income:{" "}
    {averageIncome.toFixed(1)}k
  </p>

  <p>
    • High-value customers:{" "}
    {highValueCustomers}
  </p>

  <p>
    • Customer health score:{" "}
    {customerHealth}/100
  </p>
</div>

        </div>

        <div className="bg-slate-900 rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-4">
            Top Customers
          </h2>

          {topCustomers.length > 0 ? (
            <div className="space-y-3">
              {topCustomers.map((customer, index) => (
                <div
                  key={index}
                  className="border border-slate-800 rounded-lg p-3"
                >
                  <div className="font-semibold">
                    {String(
                      getMappedValue(
                        customer,
                        mapping,
                        "customer"
                      ) ?? "Unknown Customer"
                    )}
                  </div>

                  <div className="text-sm text-slate-400">
                    Value:{" "}
                    {(
                      getMappedNumber(
                        customer,
                        mapping,
                        "revenue"
                      ) ?? 0
                    ).toFixed(1)}
                    k
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400">
              No customer value data available.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}