import { getCurrentUserId } from "@/lib/auth";
import { analyzeAnomaliesForUser } from "@/lib/analytics/anomaly-detection";

export async function POST() {
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

  const anomalies = await analyzeAnomaliesForUser(userId);

  return Response.json({
    success: true,
    anomalies,
  });
}
