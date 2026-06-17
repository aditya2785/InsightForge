import { prisma } from "@/lib/prisma";
import type { BusinessHealthScoreDTO, BusinessRow } from "@/lib/types";
import type { ColumnMapping } from "@/lib/analytics/column-mapper";
import {
  aggregateByPeriod,
  getFieldDate,
  getFieldNumber,
  getFieldValue,
  getLatestDatasetRecords,
} from "@/lib/analytics/dataset-utils";

type DatasetBundle = {
  salesRows: BusinessRow[];
  salesMapping: ColumnMapping;
  inventoryRows: BusinessRow[];
  inventoryMapping: ColumnMapping;
  customerRows: BusinessRow[];
  customerMapping: ColumnMapping;
};

type PeriodValue = {
  period: string;
  value: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function toScore(value: number) {
  return Math.round(clamp(value, 0, 25));
}

function scoreTrend(latest: number, previous: number | null) {
  if (previous === null) {
    return latest > 0 ? 16 : 0;
  }

  if (previous <= 0) {
    return latest > 0 ? 20 : 8;
  }

  const change = (latest - previous) / previous;

  if (change >= 0.25) return 25;
  if (change >= 0.1) return 22;
  if (change >= 0) return 19;
  if (change >= -0.1) return 14;
  if (change >= -0.25) return 9;
  return 4;
}

function buildRevenuePeriods(
  salesRows: BusinessRow[],
  mapping: ColumnMapping
) {
  return aggregateByPeriod(salesRows, mapping, "revenue");
}

function calculateRevenueScore(
  salesRows: BusinessRow[],
  mapping: ColumnMapping
) {
  if (!mapping.revenue) {
    return 0;
  }

  const periods = buildRevenuePeriods(salesRows, mapping);

  if (periods.length === 0) {
    const totalRevenue = salesRows.reduce(
      (sum, row) => sum + (getFieldNumber(row, mapping, "revenue") ?? 0),
      0
    );

    return totalRevenue > 0 ? 14 : 0;
  }

  const latest = periods.at(-1)?.value ?? 0;
  const previous = periods.length > 1
    ? periods.at(-2)?.value ?? null
    : null;

  return toScore(scoreTrend(latest, previous));
}

function calculateInventoryScore(
  inventoryRows: BusinessRow[],
  mapping: ColumnMapping
) {
  if (!mapping.inventory || inventoryRows.length === 0) {
    return 0;
  }

  const stockValues = inventoryRows
    .map((row) => getFieldNumber(row, mapping, "inventory"))
    .filter((value): value is number => value !== null);

  if (stockValues.length === 0) {
    return 0;
  }

  const averageStock =
    stockValues.reduce((sum, value) => sum + value, 0) / stockValues.length;
  const healthyRows = stockValues.filter(
    (value) => value > 0 && value <= averageStock * 3
  ).length;

  return toScore((healthyRows / stockValues.length) * 25);
}

function buildCustomerPeriods(
  customerRows: BusinessRow[],
  customerMapping: ColumnMapping,
  salesRows: BusinessRow[],
  salesMapping: ColumnMapping
) {
  const sourceRows = customerRows.length > 0
    ? customerRows
    : salesRows;
  const sourceMapping = customerRows.length > 0
    ? customerMapping
    : salesMapping;
  const customersByPeriod = new Map<string, Set<string>>();

  if (!sourceMapping.customer || !sourceMapping.date) {
    return [];
  }

  for (const row of sourceRows) {
    const date = getFieldDate(row, sourceMapping);
    const customer = getFieldValue(row, sourceMapping, "customer");

    if (!date || !customer) {
      continue;
    }

    const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

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

function calculateCustomerScore(
  customerRows: BusinessRow[],
  customerMapping: ColumnMapping,
  salesRows: BusinessRow[],
  salesMapping: ColumnMapping
) {
  const periods = buildCustomerPeriods(
    customerRows,
    customerMapping,
    salesRows,
    salesMapping
  );

  if (periods.length > 0) {
    const latest = periods.at(-1)?.value ?? 0;
    const previous = periods.length > 1
      ? periods.at(-2)?.value ?? null
      : null;

    return toScore(scoreTrend(latest, previous));
  }

  const uniqueCustomers = new Set(
    [
      ...customerRows.map((row) =>
        getFieldValue(row, customerMapping, "customer")
      ),
      ...salesRows.map((row) =>
        getFieldValue(row, salesMapping, "customer")
      ),
    ]
      .filter(Boolean)
      .map(String)
  ).size;

  if (uniqueCustomers >= 100) return 20;
  if (uniqueCustomers >= 25) return 17;
  if (uniqueCustomers >= 5) return 13;
  if (uniqueCustomers > 0) return 8;
  return 0;
}

function calculateForecastReadinessScore(bundle: DatasetBundle) {
  const revenuePeriods = buildRevenuePeriods(
    bundle.salesRows,
    bundle.salesMapping
  );
  const hasSalesHistory = revenuePeriods.length >= 3;
  const hasProductSignal = Boolean(bundle.salesMapping.product);
  const hasInventory = Boolean(bundle.inventoryMapping.inventory);
  const hasCustomers =
    Boolean(bundle.customerMapping.customer) ||
    Boolean(bundle.salesMapping.customer);

  let score = 0;

  if (hasSalesHistory) score += 10;
  else if (revenuePeriods.length >= 2) score += 7;
  else if (revenuePeriods.length === 1) score += 4;

  if (hasProductSignal) score += 5;
  if (hasInventory) score += 5;
  if (hasCustomers) score += 5;

  return toScore(score);
}

function toDTO(
  current: {
    id: string;
    score: number;
    revenueScore: number;
    inventoryScore: number;
    customerScore: number;
    forecastScore: number;
    createdAt: Date;
  },
  previousScore: number | null
): BusinessHealthScoreDTO {
  const delta = previousScore === null
    ? 0
    : current.score - previousScore;

  return {
    id: current.id,
    score: current.score,
    revenueScore: current.revenueScore,
    inventoryScore: current.inventoryScore,
    customerScore: current.customerScore,
    forecastScore: current.forecastScore,
    trend:
      previousScore === null
        ? "new"
        : delta > 0
        ? "up"
        : delta < 0
        ? "down"
        : "flat",
    previousScore,
    createdAt: current.createdAt.toISOString(),
  };
}

export async function getLatestDatasetBundle(
  userId: string
): Promise<DatasetBundle> {
  const datasets = await getLatestDatasetRecords(userId);

  return {
    salesRows: datasets.sales?.rows ?? [],
    salesMapping: datasets.sales?.mapping ?? {},
    customerRows: datasets.customers?.rows ?? [],
    customerMapping: datasets.customers?.mapping ?? {},
    inventoryRows: datasets.inventory?.rows ?? [],
    inventoryMapping: datasets.inventory?.mapping ?? {},
  };
}

export function calculateBusinessHealthScore(bundle: DatasetBundle) {
  const revenueScore = calculateRevenueScore(
    bundle.salesRows,
    bundle.salesMapping
  );
  const inventoryScore = calculateInventoryScore(
    bundle.inventoryRows,
    bundle.inventoryMapping
  );
  const customerScore = calculateCustomerScore(
    bundle.customerRows,
    bundle.customerMapping,
    bundle.salesRows,
    bundle.salesMapping
  );
  const forecastScore = calculateForecastReadinessScore(bundle);
  const score =
    revenueScore +
    inventoryScore +
    customerScore +
    forecastScore;

  return {
    score,
    revenueScore,
    inventoryScore,
    customerScore,
    forecastScore,
  };
}

export async function recalculateBusinessHealthScore(userId: string) {
  const bundle = await getLatestDatasetBundle(userId);
  const calculated = calculateBusinessHealthScore(bundle);

  return prisma.businessHealthScore.create({
    data: {
      userId,
      ...calculated,
    },
  });
}

export async function getLatestBusinessHealthScore(
  userId: string
): Promise<BusinessHealthScoreDTO | null> {
  const scores = await prisma.businessHealthScore.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 2,
  });

  const [current, previous] = scores;

  if (!current) {
    return null;
  }

  return toDTO(current, previous?.score ?? null);
}

export type { DatasetBundle, PeriodValue };
