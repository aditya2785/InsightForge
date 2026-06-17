export type BusinessRow = Record<string, unknown>;

export type ChartPoint = {
  month: string;
  revenue: number;
};

export type TopProduct = {
  product: string;
  revenue: number;
};

export type BusinessHealthScoreDTO = {
  id: string;
  score: number;
  revenueScore: number;
  inventoryScore: number;
  customerScore: number;
  forecastScore: number;
  trend: "up" | "down" | "flat" | "new";
  previousScore: number | null;
  createdAt: string;
};

export type ForecastDTO = {
  id: string;
  forecastType: "SALES" | "PRODUCT_DEMAND" | "INVENTORY_REQUIREMENT";
  predictionDate: string;
  predictedValue: number;
  confidenceScore: number;
  createdAt: string;
};

export type AnomalyDTO = {
  id: string;
  anomalyType:
    | "REVENUE_DROP"
    | "PRODUCT_UNDERPERFORMANCE"
    | "INVENTORY_RISK"
    | "CUSTOMER_CHURN_RISK";
  title: string;
  description: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  detectedAt: string;
  createdAt: string;
};
