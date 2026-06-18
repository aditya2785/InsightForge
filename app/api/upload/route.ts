import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getCurrentUserId } from "@/lib/auth";
import { recalculateBusinessHealthScore } from "@/lib/analytics/business-health";
import { generateForecastsForUser } from "@/lib/analytics/forecasting";
import { analyzeAnomaliesForUser } from "@/lib/analytics/anomaly-detection";
import { detectDatasetTypes } from "@/lib/dataset-detector";
import {
  assessCompatibility,
  getHeadersFromRows,
  mapColumns,
} from "@/lib/analytics/column-mapper";
import type { BusinessRow } from "@/lib/types";

const datasetTypes = [
  "sales",
  "inventory",
  "customers",
] as const;

function isSupportedDatasetType(value: unknown) {
  return (
    typeof value === "string" &&
    datasetTypes.includes(
      value as (typeof datasetTypes)[number]
    )
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { datasetType, rows } = body;

    const userId = await getCurrentUserId();

    if (!userId) {
      return Response.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    if (
      !isSupportedDatasetType(datasetType) ||
      !Array.isArray(rows)
    ) {
      return Response.json(
        {
          success: false,
          error: "Invalid dataset upload",
        },
        { status: 400 }
      );
    }

    const businessRows = rows as BusinessRow[];
    const detectedTypes = detectDatasetTypes(
      Object.keys(businessRows[0] || {})
    );
    console.log(
  "Detected dataset types:",
  detectedTypes
);
    const columnMapping = mapColumns(getHeadersFromRows(businessRows));
    const compatibility =
      assessCompatibility(columnMapping);

    const saved = await prisma.uploadedData.create({
      data: {
        datasetType,
        data: businessRows as Prisma.InputJsonValue,
        columnMapping: columnMapping as Prisma.InputJsonValue,
        compatibilityScore: compatibility.score,
        compatibilityDetails: compatibility as Prisma.InputJsonValue,
        userId,
      },
    });

    const healthScore =
      await recalculateBusinessHealthScore(userId);
    const [forecasts, anomalies] = await Promise.all([
      generateForecastsForUser(userId),
      analyzeAnomaliesForUser(userId),
    ]);

    return Response.json({
      success: true,
      id: saved.id,

      detectedTypes,

      healthScore: {
        score: healthScore.score,
        revenueScore: healthScore.revenueScore,
        inventoryScore: healthScore.inventoryScore,
        customerScore: healthScore.customerScore,
        forecastScore: healthScore.forecastScore,
      },
      forecastCount: forecasts.length,
      anomalyCount: anomalies.length,
      columnMapping,
      compatibility,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return Response.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const uploads = await prisma.uploadedData.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return Response.json(uploads);
  } catch (error) {

    return Response.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 }
    );
  }
}
