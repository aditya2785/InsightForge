import type { BusinessRow } from "@/lib/types";

export default function InventoryAnalytics({
  inventoryRows,
  inventoryAvailable,
}: {
  inventoryRows: BusinessRow[];
  inventoryAvailable: boolean;
}) {

  const totalProducts =
    inventoryRows.length;

  return (
    <div>

      <div className="grid md:grid-cols-4 gap-6 mb-8">

        <div className="bg-slate-900 p-6 rounded-xl">
          <h3>
            Products
          </h3>

          <p className="text-3xl font-bold">
            {inventoryAvailable ? totalProducts : "Unavailable"}
          </p>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl">
          <h3>
            Inventory Records
          </h3>

          <p className="text-3xl font-bold">
            {inventoryRows.length}
          </p>
        </div>

      </div>

      <div className="bg-slate-900 rounded-xl p-6">
        <h2 className="text-2xl font-semibold mb-4">
          Inventory Analysis
        </h2>

        <p>
          {inventoryAvailable
            ? "Inventory dataset loaded successfully."
            : "Inventory data unavailable."}
        </p>
      </div>

    </div>
  );
}
