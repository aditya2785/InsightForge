import type { BusinessRow } from "@/lib/types";

export type ColumnMapping = {
  revenue?: string;
  product?: string;
  customer?: string;
  date?: string;
  quantity?: string;
  inventory?: string;
  forecast?: string;
  price?: string;
};

export type CompatibilityAssessment = {
  score: number;
  supported: (keyof ColumnMapping)[];
  missing: (keyof ColumnMapping)[];
  warnings: string[];
};

const aliasMap: Record<keyof ColumnMapping, string[]> = {
  revenue: [
    "revenue",
    "sales",
    "sales amount",
    "sales_amount",
    "amount",
    "total",
    "total sales",
    "income",
    "revenue amount",
    "transaction value",
  ],
  product: [
    "product",
    "item",
    "sku",
    "product name",
    "product_name",
    "item name",
  ],
  customer: [
    "customer",
    "customer id",
    "customer_id",
    "client",
    "client id",
    "buyer",
    "user",
  ],
  date: [
    "date",
    "order date",
    "order_date",
    "transaction date",
    "transaction_date",
    "purchase date",
  ],
quantity: [
  "quantity",
  "quantity ordered",
  "quantityordered",
  "qty",
  "units",
  "units sold",
  "count",
  "order quantity",
],
  inventory: [
    "inventory",
    "stock",
    "inventory level",
    "inventory_level",
    "stock level",
    "stock_level",
  ],
  forecast: [
  "forecast",
  "demand forecast",
  "predicted demand",
],

  price: [
  "price",
  "unit price",
  "cost",
  "selling price",
]
};

const fieldWeights: Record<keyof ColumnMapping, number> = {
  revenue: 25,
  product: 15,
  customer: 15,
  date: 20,
  quantity: 10,
  inventory: 15,
  forecast: 5,
  price: 5,
};

export function normalizeHeader(header: string) {
  return header
    .toLowerCase()
    .trim()
    .replace(/_/g, " ")
    .replace(/\s+/g, " ");
}

export function mapColumns(headers: string[]): ColumnMapping {
  const normalizedHeaders = headers.map((header) => ({
    original: header,
    normalized: normalizeHeader(header),
  }));
  const mapping: ColumnMapping = {};

  for (const [field, aliases] of Object.entries(aliasMap) as [
    keyof ColumnMapping,
    string[],
  ][]) {
    const normalizedAliases = aliases.map(normalizeHeader);
    const exact = normalizedHeaders.find((header) =>
      normalizedAliases.includes(header.normalized)
    );
    const partial = normalizedHeaders.find((header) =>
      normalizedAliases.some(
        (alias) =>
          header.normalized.includes(alias) ||
          alias.includes(header.normalized)
      )
    );
    const match = exact ?? partial;

    if (match) {
      mapping[field] = match.original;
    }
  }

  return mapping;
}

export function getHeadersFromRows(rows: BusinessRow[]) {
  const headerSet = new Set<string>();

  for (const row of rows.slice(0, 25)) {
    Object.keys(row).forEach((header) => headerSet.add(header));
  }

  return [...headerSet];
}

export function assessCompatibility(
  mapping: ColumnMapping
): CompatibilityAssessment {
  const supported = (Object.keys(fieldWeights) as (keyof ColumnMapping)[])
    .filter((field) => Boolean(mapping[field]));
  const missing = (Object.keys(fieldWeights) as (keyof ColumnMapping)[])
    .filter((field) => !mapping[field]);
  const score = supported.reduce(
    (sum, field) => sum + fieldWeights[field],
    0
  );
  const warnings = missing.map(
    (field) => `${field} column not detected`
  );

  return {
    score,
    supported,
    missing,
    warnings,
  };
}

export function getMappedValue(
  row: BusinessRow,
  mapping: ColumnMapping | null | undefined,
  field: keyof ColumnMapping
) {
  const mappedColumn = mapping?.[field];

  if (!mappedColumn) {
    return undefined;
  }

  return row[mappedColumn];
}

export function getMappedNumber(
  row: BusinessRow,
  mapping: ColumnMapping | null | undefined,
  field: keyof ColumnMapping
) {
  const value = getMappedValue(row, mapping, field);

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function getMappedDate(
  row: BusinessRow,
  mapping: ColumnMapping | null | undefined
) {
  const value = getMappedValue(row, mapping, "date");

  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  const str = String(value).trim();

  const isoDate = new Date(str);

  if (!Number.isNaN(isoDate.getTime())) {
    return isoDate;
  }

  const match = str.match(
    /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/
  );

  if (match) {
    let [, day, month, year] = match;

    const fullYear =
      year.length === 2
        ? Number(`20${year}`)
        : Number(year);

    return new Date(
      fullYear,
      Number(month) - 1,
      Number(day)
    );
  }

  return null;
}
