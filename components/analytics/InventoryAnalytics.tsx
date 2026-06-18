import type { BusinessRow } from "@/lib/types";
import InventoryChart from "@/components/charts/InventoryChart";
import {
  getMappedNumber,
  getMappedValue,
  type ColumnMapping,
} from "@/lib/analytics/column-mapper";

export default function InventoryAnalytics({
  inventoryRows,
  inventoryAvailable,
  mapping,
}: {
  inventoryRows: BusinessRow[];
  inventoryAvailable: boolean;
  mapping: ColumnMapping;
}) {

  
  const totalProducts = inventoryRows.length;

  const totalInventory = inventoryRows.reduce(
    (sum, row) =>
      sum +
      (getMappedNumber(row, mapping, "inventory") ?? 0),
    0
  );

  const totalUnitsSold = inventoryRows.reduce(
    (sum, row) =>
      sum +
      (getMappedNumber(row, mapping, "quantity") ?? 0),
    0
  );

  const averageInventory =
    inventoryRows.length > 0
      ? totalInventory / inventoryRows.length
      : 0;

  const inventoryHealth =
    totalInventory > totalUnitsSold
      ? Math.min(
          100,
          Math.round(
            (totalUnitsSold / totalInventory) * 100
          )
        )
      : 100;

  const shortageRisks = inventoryRows
    .filter((row) => {
      const stock =
        getMappedNumber(
          row,
          mapping,
          "inventory"
        ) ?? 0;

      const sold =
        getMappedNumber(
          row,
          mapping,
          "quantity"
        ) ?? 0;

      return stock < sold;
    })
    .slice(0, 5);

  const inventoryChartData = inventoryRows
  .map((row) => ({
    product: String(
      getMappedValue(
        row,
        mapping,
        "product"
      ) ?? "Unknown"
    ),
    inventory:
      getMappedNumber(
        row,
        mapping,
        "inventory"
      ) ?? 0,
  }))
  .sort((a, b) => b.inventory - a.inventory)
  .slice(0, 10);

  return (
    <div>
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-900 p-6 rounded-xl">
          <h3>Products</h3>
          <p className="text-3xl font-bold">
            {inventoryAvailable
              ? totalProducts.toLocaleString()
              : "Unavailable"}
          </p>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl">
          <h3>Total Inventory</h3>
          <p className="text-3xl font-bold">
            {totalInventory.toLocaleString()}
          </p>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl">
          <h3>Units Sold</h3>
          <p className="text-3xl font-bold">
            {totalUnitsSold.toLocaleString()}
          </p>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl">
          <h3>Inventory Health</h3>
          <p className="text-3xl font-bold">
            {inventoryHealth}/100
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 rounded-xl p-6">
<h2 className="text-2xl font-semibold mb-4">
  Inventory Distribution
</h2>

{inventoryAvailable && inventoryChartData.length > 0 ? (
  <InventoryChart
    data={inventoryChartData}
  />
) : (
  <p className="text-slate-400">
    No inventory data available.
  </p>
)}

          <div className="space-y-3 text-slate-300 mt-6">
            <p>
              • Total inventory units:{" "}
              {totalInventory.toLocaleString()}
            </p>

            <p>
              • Units sold:{" "}
              {totalUnitsSold.toLocaleString()}
            </p>

            <p>
              • Average stock level:{" "}
              {averageInventory.toFixed(0)}
            </p>

            <p>
              • Inventory health score:{" "}
              {inventoryHealth}/100
            </p>
          </div>
        </div>

        <div className="bg-slate-900 rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-4">
            Potential Shortage Risks
          </h2>

          {shortageRisks.length > 0 ? (
            <div className="space-y-3">
              {shortageRisks.map((row, index) => (
                <div
                  key={index}
                  className="border border-slate-800 rounded-lg p-3"
                >
                  <div className="font-semibold">
                    {String(
                      getMappedValue(
                        row,
                        mapping,
                        "product"
                      ) ?? "Unknown Product"
                    )}
                  </div>

                  <div className="text-sm text-slate-400">
                    Stock:{" "}
                    {getMappedNumber(
                      row,
                      mapping,
                      "inventory"
                    ) ?? 0}
                  </div>

                  <div className="text-sm text-slate-400">
                    Sold:{" "}
                    {getMappedNumber(
                      row,
                      mapping,
                      "quantity"
                    ) ?? 0}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400">
              No inventory shortages detected.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}