import type {
  AnomalyDTO,
  BusinessHealthScoreDTO,
} from "@/lib/types";

type RiskCenterProps = {
  anomalies: AnomalyDTO[];
  healthScore: BusinessHealthScoreDTO | null;
};

const severityStyles: Record<AnomalyDTO["severity"], string> = {
  HIGH: "bg-red-500/10 text-red-300 border-red-500/30",
  MEDIUM: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  LOW: "bg-blue-500/10 text-blue-300 border-blue-500/30",
};

const anomalyLabels: Record<AnomalyDTO["anomalyType"], string> = {
  REVENUE_DROP: "Revenue Alert",
  PRODUCT_UNDERPERFORMANCE: "Product Performance",
  INVENTORY_RISK: "Inventory Alert",
  CUSTOMER_CHURN_RISK: "Customer Churn",
};

function getMaxAnomalies(score: number) {
  if (score >= 80) return 2;
  if (score >= 70) return 3;
  if (score >= 50) return 4;
  return 5;
}

export default function RiskCenter({
  anomalies,
  healthScore,
}: RiskCenterProps) {
  const score = healthScore?.score ?? 0;

  const displayedAnomalies = anomalies.slice(
    0,
    getMaxAnomalies(score)
  );

  const highPriorityCount = displayedAnomalies.filter(
    (anomaly) => anomaly.severity === "HIGH"
  ).length;

  return (
    <section className="mb-8">
      <div className="flex items-end justify-between gap-4 mb-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-slate-400">
            Risk Center
          </p>
          <h2 className="text-2xl font-semibold">
            Active business anomalies
          </h2>
        </div>

        <p className="text-sm text-slate-400">
          {highPriorityCount} high priority
        </p>
      </div>

      {displayedAnomalies.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-300">
          No active risks detected from the latest uploaded datasets.
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          {displayedAnomalies.map((anomaly) => (
            <div
              key={anomaly.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-400">
                    {anomalyLabels[anomaly.anomalyType]}
                  </p>

                  <h3 className="text-lg font-semibold mt-1">
                    {anomaly.title}
                  </h3>
                </div>

                <span
                  className={`text-xs font-semibold border rounded-full px-3 py-1 ${severityStyles[anomaly.severity]}`}
                >
                  {anomaly.severity}
                </span>
              </div>

              <p className="text-slate-300 mt-3">
                {anomaly.description}
              </p>

              <p className="text-xs text-slate-500 mt-4">
                Detected{" "}
                {new Date(anomaly.detectedAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}