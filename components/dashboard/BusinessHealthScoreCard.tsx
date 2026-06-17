import type { BusinessHealthScoreDTO } from "@/lib/types";

type BusinessHealthScoreCardProps = {
  healthScore: BusinessHealthScoreDTO | null;
};

const breakdownItems = [
  {
    key: "revenueScore",
    label: "Revenue Trend",
  },
  {
    key: "inventoryScore",
    label: "Inventory Efficiency",
  },
  {
    key: "customerScore",
    label: "Customer Growth",
  },
  {
    key: "forecastScore",
    label: "Forecast Readiness",
  },
] as const;

function getScoreLabel(score: number) {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Strong";
  if (score >= 50) return "Needs Attention";
  return "High Risk";
}

function getTrendText(healthScore: BusinessHealthScoreDTO) {
  if (healthScore.trend === "new") {
    return "First score captured";
  }

  const delta =
    healthScore.previousScore === null
      ? 0
      : healthScore.score - healthScore.previousScore;

  if (healthScore.trend === "up") {
    return `Up ${delta} pts from last score`;
  }

  if (healthScore.trend === "down") {
    return `Down ${Math.abs(delta)} pts from last score`;
  }

  return "Flat from last score";
}

export default function BusinessHealthScoreCard({
  healthScore,
}: BusinessHealthScoreCardProps) {
  if (!healthScore) {
    return (
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-sm uppercase tracking-wide text-slate-400">
              Business Health Score
            </p>
            <h2 className="text-3xl font-bold mt-2">
              Not enough data yet
            </h2>
            <p className="text-slate-400 mt-3 max-w-2xl">
              Upload sales, inventory, or customer datasets to calculate an
              Aurora-backed score across revenue trend, inventory efficiency,
              customer growth, and forecast readiness.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">
        <div>
          <p className="text-sm uppercase tracking-wide text-slate-400">
            Business Health Score
          </p>
          <div className="flex items-end gap-4 mt-2">
            <h2 className="text-6xl font-bold">
              {healthScore.score}
            </h2>
            <div className="pb-2">
              <p className="text-xl font-semibold">
                {getScoreLabel(healthScore.score)}
              </p>
              <p className="text-slate-400">
                {getTrendText(healthScore)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 flex-1">
          {breakdownItems.map((item) => {
            const value = healthScore[item.key];
            const width = `${(value / 25) * 100}%`;

            return (
              <div
                key={item.key}
                className="bg-slate-950 border border-slate-800 rounded-lg p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-slate-300">
                    {item.label}
                  </p>
                  <p className="font-semibold">
                    {value}/25
                  </p>
                </div>
                <div className="mt-3 h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{ width }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
