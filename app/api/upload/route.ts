import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

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

    const saved = await prisma.uploadedData.create({
      data: {
        datasetType,
        data: rows,
        userId,
      },
    });

    return Response.json({
      success: true,
      id: saved.id,
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
