import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

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

    return Response.json({
      success: true,
      salesRows: sales?.data ?? [],
      customerRows: customers?.data ?? [],
      inventoryRows: inventory?.data ?? [],
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