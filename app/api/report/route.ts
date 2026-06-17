import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY!
);

export async function POST() {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const uploads = await prisma.uploadedData.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    if (uploads.length === 0) {
  return Response.json({
    report:
      "No datasets have been uploaded yet. Please upload business data before generating a report.",
  });
}

    const prompt = `
Generate a professional business report.

Use only the authenticated user's uploaded datasets below.
If data is missing, mention it as a gap.

Include:
1. Executive Summary
2. Revenue Analysis
3. Customer Analysis
4. Inventory Analysis
5. Risks
6. Opportunities
7. Recommendations
8. Forecast

Uploaded datasets:
${JSON.stringify(
  uploads.map((upload) => ({
    datasetType: upload.datasetType,
    createdAt: upload.createdAt,
    columnMapping: upload.columnMapping,
    compatibilityScore: upload.compatibilityScore,
    compatibilityDetails: upload.compatibilityDetails,
    rows: Array.isArray(upload.data)
      ? upload.data.slice(0, 10)
      : upload.data,
  })),
  null,
  2
)}
`;

    const result = await model.generateContent(prompt);

    return Response.json({
      report: result.response.text(),
    });

  } catch (error) {
    console.error("REPORT GENERATION ERROR:", error);

    return Response.json(
      {
        error: "AI report generation temporarily unavailable. Please try again.",
      },
      { status: 500 }
    );
  }
}