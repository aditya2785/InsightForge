import type { BusinessRow } from "@/lib/types";

export default function CustomerAnalytics({
  customerRows,
}: {
  customerRows: BusinessRow[];
}) {

  return (
    <div>

      <div className="grid md:grid-cols-4 gap-6 mb-8">

        <div className="bg-slate-900 p-6 rounded-xl">
          <h3>
            Customers
          </h3>

          <p className="text-3xl font-bold">
            {customerRows.length}
          </p>
        </div>

      </div>

      <div className="bg-slate-900 rounded-xl p-6">
        <h2 className="text-2xl font-semibold mb-4">
          Customer Analysis
        </h2>

        <p>
          Customer dataset loaded successfully.
        </p>
      </div>

    </div>
  );
}
