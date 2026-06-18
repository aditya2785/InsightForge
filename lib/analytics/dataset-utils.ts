import { prisma } from "@/lib/prisma";
import type { BusinessRow } from "@/lib/types";
import {
  assessCompatibility,
  getHeadersFromRows,
  getMappedDate,
  getMappedNumber,
  getMappedValue,
  mapColumns,
  type ColumnMapping,
  type CompatibilityAssessment,
} from "@/lib/analytics/column-mapper";

export type DatasetRecord = {
  id: number;
  datasetType: string;
  rows: BusinessRow[];
  mapping: ColumnMapping;
  compatibility: CompatibilityAssessment;
  createdAt: Date;
};

export type DatasetRecords = {
  sales: DatasetRecord | null;
  inventory: DatasetRecord | null;
  customers: DatasetRecord | null;
};

export type PeriodMetric = {
  period: string;
  date: Date;
  value: number;
};

type UploadedDatasetLike = {
  id: number;
  datasetType: string;
  data: unknown;
  columnMapping?: unknown;
  compatibilityScore?: number | null;
  compatibilityDetails?: unknown;
  createdAt: Date;
};

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function getPeriod(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function parsePeriod(period: string) {
  const [year, month] = period.split("-").map(Number);
  return new Date(year, month - 1, 1);
}

export function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

export function rowsFromJson(value: unknown): BusinessRow[] {
  return Array.isArray(value)
    ? value.filter(
        (row): row is BusinessRow =>
          Boolean(row) &&
          typeof row === "object" &&
          !Array.isArray(row)
      )
    : [];
}

function isColumnMapping(value: unknown): value is ColumnMapping {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function getStoredCompatibility(
  value: unknown,
  mapping: ColumnMapping
): CompatibilityAssessment {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    "score" in value &&
    "supported" in value &&
    "missing" in value &&
    "warnings" in value
  ) {
    return value as CompatibilityAssessment;
  }

  return assessCompatibility(mapping);
}

export function createDatasetRecord(
  upload: UploadedDatasetLike | null | undefined
): DatasetRecord | null {
  if (!upload) {
    return null;
  }

  const rows = rowsFromJson(upload.data);
  console.log("ROWS LENGTH:", rows.length);
  const derivedMapping = mapColumns(getHeadersFromRows(rows));
  const mapping = isColumnMapping(upload.columnMapping)
    ? upload.columnMapping
    : derivedMapping;
  const compatibility = getStoredCompatibility(
    upload.compatibilityDetails,
    mapping
  );

  return {
    id: upload.id,
    datasetType: upload.datasetType,
    rows,
    mapping,
    compatibility,
    createdAt: upload.createdAt,
  };
}

export function getFieldValue(
  row: BusinessRow,
  mapping: ColumnMapping,
  field: keyof ColumnMapping
) {
  return getMappedValue(row, mapping, field);
}

export function getFieldNumber(
  row: BusinessRow,
  mapping: ColumnMapping,
  field: keyof ColumnMapping
) {
  if (field === "revenue") {
    const revenue = getMappedNumber(
      row,
      mapping,
      "revenue"
    );

    if (revenue !== null) {
      return revenue;
    }

    const price = getMappedNumber(
      row,
      mapping,
      "price"
    );

    const quantity = getMappedNumber(
      row,
      mapping,
      "quantity"
    );

    if (
      price !== null &&
      quantity !== null
    ) {
      return price * quantity;
    }

    return null;
  }

  return getMappedNumber(
    row,
    mapping,
    field
  );
}

export function getFieldDate(row: BusinessRow, mapping: ColumnMapping) {
  return getMappedDate(row, mapping);
}

export function aggregateByPeriod(
  rows: BusinessRow[],
  mapping: ColumnMapping,
  metricField: keyof ColumnMapping,
  fallbackValue: number | null = null
) {
  const values = new Map<string, number>();

  if (!mapping.date) {
  return [];
}

if (
  metricField === "revenue" &&
  !mapping.revenue
) {
  const canEstimateRevenue =
    mapping.price &&
    mapping.quantity;

  if (!canEstimateRevenue) {
    return [];
  }
} else if (!mapping[metricField]) {
  return [];
}

  for (const row of rows) {
    const date = getFieldDate(row, mapping);

    if (!date) {
      continue;
    }

    const metric =
      getFieldNumber(row, mapping, metricField) ?? fallbackValue;

    if (metric === null) {
      continue;
    }

    const period = getPeriod(date);
    values.set(period, (values.get(period) ?? 0) + metric);
  }

  return [...values.entries()]
    .map(([period, value]) => ({
      period,
      date: parsePeriod(period),
      value,
    }))
    .sort((a, b) => a.period.localeCompare(b.period));
}

export function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function getLinearSlope(values: number[]) {
  if (values.length < 2) {
    return 0;
  }

  const first = values[0];
  const last = values[values.length - 1];

  return (last - first) / (values.length - 1);
}

export function getVolatility(values: number[]) {
  if (values.length < 2) {
    return 0;
  }

  const mean = average(values);

  if (mean === 0) {
    return 0;
  }

  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
    values.length;

  return Math.sqrt(variance) / Math.abs(mean);
}

export function getConfidence(values: number[]) {
  const historyScore = clamp(values.length / 6, 0, 1) * 65;
  const stabilityScore = (1 - clamp(getVolatility(values), 0, 1)) * 35;

  return Math.round(clamp(historyScore + stabilityScore, 35, 95));
}

export async function getLatestDatasetRecords(
  userId: string
): Promise<DatasetRecords> {
  const [sales, inventory, customers] = await Promise.all([
    prisma.uploadedData.findFirst({
      where: { userId, datasetType: "sales" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.uploadedData.findFirst({
      where: { userId, datasetType: "inventory" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.uploadedData.findFirst({
      where: { userId, datasetType: "customers" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    sales: createDatasetRecord(sales),
    inventory: createDatasetRecord(inventory),
    customers: createDatasetRecord(customers),
  };
}
