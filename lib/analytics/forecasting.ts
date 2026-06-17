import { prisma } from "@/lib/prisma";
import type { BusinessRow, ForecastDTO } from "@/lib/types";
import type { ColumnMapping } from "@/lib/analytics/column-mapper";
import {
  addMonths,
  aggregateByPeriod,
  average,
  clamp,
  getConfidence,
  getFieldNumber,
  getLatestDatasetRecords,
  getLinearSlope,
} from "@/lib/analytics/dataset-utils";

type ForecastType =
  | "SALES"
  | "PRODUCT_DEMAND"
  | "INVENTORY_REQUIREMENT";

type ForecastInput = {
  userId: string;
  datasetId: number;
  forecastType: ForecastType;
  predictionDate: Date;
  predictedValue: number;
  confidenceScore: number;
};

function nextPredictionDates(lastDate: Date) {
  return [1, 2, 3].map((offset) => addMonths(lastDate, offset));
}

function projectValues(values: number[]) {
  const recentValues = values.slice(-6);
  const baseline = average(recentValues.slice(-3));
  const slope = getLinearSlope(recentValues);

  return [1, 2, 3].map((step) =>
    Math.max(0, baseline + slope * step)
  );
}

function buildTimeSeriesForecasts({
  userId,
  datasetId,
  forecastType,
  periods,
}: {
  userId: string;
  datasetId: number;
  forecastType: ForecastType;
  periods: { date: Date; value: number }[];
}): ForecastInput[] {
  if (periods.length === 0) {
    return [];
  }

  const values = periods.map((period) => period.value);
  const predictions = projectValues(values);
  const confidence = getConfidence(values);
  const lastDate = periods[periods.length - 1].date;

  return nextPredictionDates(lastDate).map((predictionDate, index) => ({
    userId,
    datasetId,
    forecastType,
    predictionDate,
    predictedValue: Number(predictions[index].toFixed(2)),
    confidenceScore: confidence,
  }));
}

function buildSalesForecasts(
  userId: string,
  datasetId: number,
  rows: BusinessRow[],
  mapping: ColumnMapping
) {
  const periods = aggregateByPeriod(rows, mapping, "revenue");

  return buildTimeSeriesForecasts({
    userId,
    datasetId,
    forecastType: "SALES",
    periods,
  });
}

function buildDemandForecasts(
  userId: string,
  datasetId: number,
  rows: BusinessRow[],
  mapping: ColumnMapping
) {
  let periods = aggregateByPeriod(
    rows,
    mapping,
    "quantity",
    1
  );

  if (periods.length === 0) {
    periods = aggregateByPeriod(
      rows,
      mapping,
      "revenue"
    );
  }

  return buildTimeSeriesForecasts({
    userId,
    datasetId,
    forecastType: "PRODUCT_DEMAND",
    periods,
  });
}

function getCurrentStock(rows: BusinessRow[], mapping: ColumnMapping) {
  return rows.reduce((sum, row) => {
    return sum + (getFieldNumber(row, mapping, "inventory") ?? 0);
  }, 0);
}

function buildInventoryForecasts({
  userId,
  datasetId,
  salesRows,
  salesMapping,
  inventoryRows,
  inventoryMapping,
}: {
  userId: string;
  datasetId: number;
  salesRows: BusinessRow[];
  salesMapping: ColumnMapping;
  inventoryRows: BusinessRow[];
  inventoryMapping: ColumnMapping;
}) {
let demandPeriods = aggregateByPeriod(
  salesRows,
  salesMapping,
  "quantity"
);

if (demandPeriods.length === 0) {
  demandPeriods = aggregateByPeriod(
    salesRows,
    salesMapping,
    "revenue"
  );
}

  if (demandPeriods.length === 0 || !inventoryMapping.inventory) {
    return [];
  }

  const demandPredictions = projectValues(
    demandPeriods.map((period) => period.value)
  );
  const confidence = clamp(
    getConfidence(demandPeriods.map((period) => period.value)) +
      (inventoryRows.length > 0 ? 5 : -10),
    30,
    95
  );
  const currentStock = getCurrentStock(inventoryRows, inventoryMapping);
  const lastDate = demandPeriods[demandPeriods.length - 1].date;

return nextPredictionDates(lastDate).map((predictionDate, index) => {
  const safetyAdjustedDemand =
    demandPredictions[index] * 1.15;

  const stockRequirement = Math.max(
    0,
    safetyAdjustedDemand - currentStock
  );

  return {
    userId,
    datasetId,
    forecastType: "INVENTORY_REQUIREMENT" as const,
    predictionDate,
    predictedValue: Number(stockRequirement.toFixed(2)),
    confidenceScore: Math.round(confidence),
  };
});
}

function toDTO(forecast: {
  id: string;
  forecastType: string;
  predictionDate: Date;
  predictedValue: number;
  confidenceScore: number;
  createdAt: Date;
}): ForecastDTO {
  return {
    id: forecast.id,
    forecastType: forecast.forecastType as ForecastDTO["forecastType"],
    predictionDate: forecast.predictionDate.toISOString(),
    predictedValue: forecast.predictedValue,
    confidenceScore: forecast.confidenceScore,
    createdAt: forecast.createdAt.toISOString(),
  };
}

export async function generateForecastsForUser(userId: string) {
  const datasets = await getLatestDatasetRecords(userId);
  const forecasts: ForecastInput[] = [];

  if (datasets.sales) {
    forecasts.push(
      ...buildSalesForecasts(
        userId,
        datasets.sales.id,
        datasets.sales.rows,
        datasets.sales.mapping
      )
    );
    forecasts.push(
      ...buildDemandForecasts(
        userId,
        datasets.sales.id,
        datasets.sales.rows,
        datasets.sales.mapping
      )
    );
  }

  if (datasets.sales && datasets.inventory) {
    forecasts.push(
      ...buildInventoryForecasts({
        userId,
        datasetId: datasets.inventory.id,
        salesRows: datasets.sales.rows,
        salesMapping: datasets.sales.mapping,
        inventoryRows: datasets.inventory.rows,
        inventoryMapping: datasets.inventory.mapping,
      })
    );
  }

  await prisma.forecast.deleteMany({
    where: {
      userId,
      forecastType: {
        in: [
          "SALES",
          "PRODUCT_DEMAND",
          "INVENTORY_REQUIREMENT",
        ],
      },
    },
  });

  if (forecasts.length > 0) {
    await prisma.forecast.createMany({
      data: forecasts,
    });
  }

  return getForecastsForUser(userId);
}

export async function getForecastsForUser(userId: string) {
  const forecasts = await prisma.forecast.findMany({
    where: {
      userId,
    },
    orderBy: [
      {
        forecastType: "asc",
      },
      {
        predictionDate: "asc",
      },
    ],
  });

  return forecasts.map(toDTO);
}

export type { ForecastType };
