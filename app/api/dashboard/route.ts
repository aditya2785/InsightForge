import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import {
  getLatestBusinessHealthScore,
  recalculateBusinessHealthScore,
} from "@/lib/analytics/business-health";
import {
  generateForecastsForUser,
  getForecastsForUser,
} from "@/lib/analytics/forecasting";
import {
  analyzeAnomaliesForUser,
  getAnomaliesForUser,
} from "@/lib/analytics/anomaly-detection";
import { createDatasetRecord } from "@/lib/analytics/dataset-utils";

export async function GET() {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return Response.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const sales = await prisma.uploadedData.findFirst({
      where: {
        datasetType: "sales",
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const customers = await prisma.uploadedData.findFirst({
      where: {
        datasetType: "customers",
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const inventory = await prisma.uploadedData.findFirst({
      where: {
        datasetType: "inventory",
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    let healthScore =
      await getLatestBusinessHealthScore(userId);

    const hasAnyDataset =
      Boolean(sales) ||
      Boolean(customers) ||
      Boolean(inventory);

    if (hasAnyDataset) {
  await recalculateBusinessHealthScore(userId);
  healthScore = await getLatestBusinessHealthScore(userId);
}

    let forecasts = await getForecastsForUser(userId);
    let anomalies = await getAnomaliesForUser(userId);

if (hasAnyDataset) {
  forecasts = await generateForecastsForUser(userId);
}

if (hasAnyDataset) {
  anomalies = await analyzeAnomaliesForUser(userId);
}

    const salesRecord = createDatasetRecord(sales);
    const customerRecord = createDatasetRecord(customers);
    const inventoryRecord = createDatasetRecord(inventory);

    return Response.json({
      success: true,
      salesRows: salesRecord?.rows ?? [],
      customerRows: customerRecord?.rows ?? [],
      inventoryRows: inventoryRecord?.rows ?? [],
      datasetMetadata: {
        sales: salesRecord
          ? {
              mapping: salesRecord.mapping,
              compatibility: salesRecord.compatibility,
            }
          : null,
        customers: customerRecord
          ? {
              mapping: customerRecord.mapping,
              compatibility: customerRecord.compatibility,
            }
          : null,
        inventory: inventoryRecord
          ? {
              mapping: inventoryRecord.mapping,
              compatibility: inventoryRecord.compatibility,
            }
          : null,
      },
      healthScore,
      forecasts,
      anomalies,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        success: false,
        message: "Failed to load dashboard data",
      },
      { status: 500 }
    );
  }
}
