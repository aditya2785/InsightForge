import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY!
);

export async function POST() {
  const userId = await getCurrentUserId();

  if (!userId) {
    return Response.json(
      {
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
    take: 10,
  });

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash"
  });

  const prompt = `
Generate a professional business report.

Use only the authenticated user's uploaded datasets below. If a dataset is
missing, call that out as a data gap instead of inventing numbers.

Include:

1. Executive Summary
2. Revenue Analysis
3. Customer Analysis
4. Inventory Analysis
5. Risks
6. Opportunities
7. Recommendations
8. Forecast

Use consulting style.

Uploaded datasets:
${JSON.stringify(
  uploads.map((upload) => ({
    datasetType: upload.datasetType,
    createdAt: upload.createdAt,
    rows: Array.isArray(upload.data) ? upload.data.slice(0, 50) : upload.data,
  })),
  null,
  2
)}
`;

  const result = await model.generateContent(prompt);

  const report = result.response.text();

  return Response.json({
    report
  });
}
