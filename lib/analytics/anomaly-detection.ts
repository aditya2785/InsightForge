import { prisma } from "@/lib/prisma";
import type { AnomalyDTO, BusinessRow } from "@/lib/types";
import type { ColumnMapping } from "@/lib/analytics/column-mapper";
import {
  aggregateByPeriod,
  average,
  getFieldDate,
  getFieldNumber,
  getFieldValue,
  getLatestDatasetRecords,
  getPeriod,
} from "@/lib/analytics/dataset-utils";

type Severity = "HIGH" | "MEDIUM" | "LOW";
type AnomalyType =
  | "REVENUE_DROP"
  | "PRODUCT_UNDERPERFORMANCE"
  | "INVENTORY_RISK"
  | "CUSTOMER_CHURN_RISK";

type AnomalyInput = {
  userId: string;
  datasetId: number;
  anomalyType: AnomalyType;
  title: string;
  description: string;
  severity: Severity;
  detectedAt: Date;
};

function getSeverity(dropRatio: number): Severity {
  if (dropRatio >= 0.4) return "HIGH";
  if (dropRatio >= 0.25) return "MEDIUM";
  return "LOW";
}

function hasConsecutiveDecline(values: number[]) {
  if (values.length < 3) {
    return false;
  }

  const recent = values.slice(-3);

  return recent[0] > recent[1] && recent[1] > recent[2];
}

function detectRevenueDrops(
  userId: string,
  datasetId: number,
  salesRows: BusinessRow[],
  mapping: ColumnMapping
): AnomalyInput[] {
  const periods = aggregateByPeriod(salesRows, mapping, "revenue");

  if (periods.length < 2) {
    return [];
  }

  const anomalies: AnomalyInput[] = [];
  const values = periods.map((period) => period.value);
  const latest = values[values.length - 1];
  const baseline = average(values.slice(0, -1));

  if (baseline > 0 && latest < baseline * 0.85) {
    const dropRatio = (baseline - latest) / baseline;
    anomalies.push({
      userId,
      datasetId,
      anomalyType: "REVENUE_DROP",
      title: "Revenue below historical baseline",
      description: `Latest period revenue is ${Math.round(dropRatio * 100)}% below the historical average.`,
      severity: getSeverity(dropRatio),
      detectedAt: new Date(),
    });
  }

  if (hasConsecutiveDecline(values)) {
    anomalies.push({
      userId,
      datasetId,
      anomalyType: "REVENUE_DROP",
      title: "Consecutive revenue decline",
      description:
        "Revenue declined across the last three detected periods, indicating a sustained downward trend.",
      severity: "HIGH",
      detectedAt: new Date(),
    });
  }

  return anomalies;
}

function getProductPeriodMap(rows: BusinessRow[], mapping: ColumnMapping) {
  const productPeriods = new Map<string, Map<string, number>>();

  if (!mapping.product || !mapping.date) {
    return productPeriods;
  }

  for (const row of rows) {
    const product = getFieldValue(row, mapping, "product");
    const date = getFieldDate(row, mapping);

    if (!product || !date) {
      continue;
    }

    const period = getPeriod(date);
    const value =
      getFieldNumber(row, mapping, "quantity") ??
      getFieldNumber(row, mapping, "revenue") ??
      1;
    const productName = String(product);

    if (!productPeriods.has(productName)) {
      productPeriods.set(productName, new Map());
    }

    const periods = productPeriods.get(productName);
    periods?.set(period, (periods.get(period) ?? 0) + value);
  }

  return productPeriods;
}

function detectProductUnderperformance(
  userId: string,
  datasetId: number,
  salesRows: BusinessRow[],
  mapping: ColumnMapping
): AnomalyInput[] {
  const productPeriods = getProductPeriodMap(salesRows, mapping);
  const anomalies: AnomalyInput[] = [];

  for (const [product, periods] of productPeriods.entries()) {
    const values = [...periods.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, value]) => value);

    if (values.length < 2) {
      continue;
    }

    const latest = values[values.length - 1];
    const baseline = average(values.slice(0, -1));

    if (baseline > 0 && latest < baseline * 0.65) {
      const dropRatio = (baseline - latest) / baseline;
      anomalies.push({
        userId,
        datasetId,
        anomalyType: "PRODUCT_UNDERPERFORMANCE",
        title: `${product} is underperforming`,
        description: `Recent demand is ${Math.round(dropRatio * 100)}% below its historical average.`,
        severity: getSeverity(dropRatio),
        detectedAt: new Date(),
      });
    }
  }

  return anomalies
    .sort((a, b) => {
      const rank = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      return rank[b.severity] - rank[a.severity];
    })
    .slice(0, 5);
}

function detectInventoryRisks(
  userId: string,
  datasetId: number,
  inventoryRows: BusinessRow[],
  mapping: ColumnMapping
): AnomalyInput[] {
  const anomalies: AnomalyInput[] = [];
  const stockValues = inventoryRows
    .map((row) => getFieldNumber(row, mapping, "inventory"))
    .filter((value): value is number => value !== null);

  if (!mapping.inventory || stockValues.length === 0) {
    return anomalies;
  }

  const averageStock = average(stockValues);
  let lowStockCount = 0;
  let overstockCount = 0;

  for (const stock of stockValues) {
    if (stock <= Math.max(10, averageStock * 0.15)) {
      lowStockCount += 1;
    }

    if (averageStock > 0 && stock > averageStock * 3) {
      overstockCount += 1;
    }
  }

  if (lowStockCount > 0) {
    anomalies.push({
      userId,
      datasetId,
      anomalyType: "INVENTORY_RISK",
      title: "Low-stock inventory risk",
      description: `${lowStockCount} inventory records are below their reorder or safety threshold.`,
      severity: lowStockCount >= 5 ? "HIGH" : "MEDIUM",
      detectedAt: new Date(),
    });
  }

  if (overstockCount > 0) {
    anomalies.push({
      userId,
      datasetId,
      anomalyType: "INVENTORY_RISK",
      title: "Overstock inventory risk",
      description: `${overstockCount} inventory records appear materially above reorder needs.`,
      severity: overstockCount >= 5 ? "MEDIUM" : "LOW",
      detectedAt: new Date(),
    });
  }

  return anomalies;
}

function buildCustomerPeriods(rows: BusinessRow[], mapping: ColumnMapping) {
  const customersByPeriod = new Map<string, Set<string>>();

  if (!mapping.customer || !mapping.date) {
    return [];
  }

  for (const row of rows) {
    const customer = getFieldValue(row, mapping, "customer");
    const date = getFieldDate(row, mapping);

    if (!customer || !date) {
      continue;
    }

    const period = getPeriod(date);

    if (!customersByPeriod.has(period)) {
      customersByPeriod.set(period, new Set());
    }

    customersByPeriod.get(period)?.add(String(customer));
  }

  return [...customersByPeriod.entries()]
    .map(([period, customers]) => ({
      period,
      value: customers.size,
    }))
    .sort((a, b) => a.period.localeCompare(b.period));
}

function detectCustomerChurnRisks(
  userId: string,
  datasetId: number,
  rows: BusinessRow[],
  mapping: ColumnMapping
): AnomalyInput[] {
  const periods = buildCustomerPeriods(rows, mapping);

  if (periods.length < 2) {
    return [];
  }

  const values = periods.map((period) => period.value);
  const latest = values[values.length - 1];
  const baseline = average(values.slice(0, -1));

  if (baseline <= 0 || latest >= baseline * 0.8) {
    return [];
  }

  const dropRatio = (baseline - latest) / baseline;

  return [
    {
      userId,
      datasetId,
      anomalyType: "CUSTOMER_CHURN_RISK",
      title: "Customer activity decline",
      description: `Recent active customers are ${Math.round(dropRatio * 100)}% below the prior average.`,
      severity: getSeverity(dropRatio),
      detectedAt: new Date(),
    },
  ];
}

function toDTO(anomaly: {
  id: string;
  anomalyType: string;
  title: string;
  description: string;
  severity: string;
  detectedAt: Date;
  createdAt: Date;
}): AnomalyDTO {
  return {
    id: anomaly.id,
    anomalyType: anomaly.anomalyType as AnomalyDTO["anomalyType"],
    title: anomaly.title,
    description: anomaly.description,
    severity: anomaly.severity as AnomalyDTO["severity"],
    detectedAt: anomaly.detectedAt.toISOString(),
    createdAt: anomaly.createdAt.toISOString(),
  };
}

export async function analyzeAnomaliesForUser(userId: string) {
  const datasets = await getLatestDatasetRecords(userId);
  const anomalies: AnomalyInput[] = [];

  if (datasets.sales) {
    anomalies.push(
      ...detectRevenueDrops(
        userId,
        datasets.sales.id,
        datasets.sales.rows,
        datasets.sales.mapping
      )
    );
    anomalies.push(
      ...detectProductUnderperformance(
        userId,
        datasets.sales.id,
        datasets.sales.rows,
        datasets.sales.mapping
      )
    );
    const churnDataset = datasets.customers ?? datasets.sales;
    anomalies.push(
      ...detectCustomerChurnRisks(
        userId,
        churnDataset.id,
        churnDataset.rows,
        churnDataset.mapping
      )
    );
  }

  if (datasets.inventory) {
    anomalies.push(
      ...detectInventoryRisks(
        userId,
        datasets.inventory.id,
        datasets.inventory.rows,
        datasets.inventory.mapping
      )
    );
  }

  await prisma.anomaly.deleteMany({
    where: {
      userId,
    },
  });

  if (anomalies.length > 0) {
    await prisma.anomaly.createMany({
      data: anomalies,
    });
  }

  return getAnomaliesForUser(userId);
}

export async function getAnomaliesForUser(userId: string) {
  const anomalies = await prisma.anomaly.findMany({
    where: {
      userId,
    },
    orderBy: [
      {
        severity: "asc",
      },
      {
        detectedAt: "desc",
      },
    ],
  });

  const severityRank = {
    HIGH: 0,
    MEDIUM: 1,
    LOW: 2,
  };

  return anomalies
    .map(toDTO)
    .sort(
      (a, b) =>
        severityRank[a.severity] - severityRank[b.severity] ||
        b.detectedAt.localeCompare(a.detectedAt)
    );
}

export type { AnomalyType, Severity };
