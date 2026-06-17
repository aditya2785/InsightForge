import { getCurrentUserId } from "@/lib/auth";
import { getAnomaliesForUser } from "@/lib/analytics/anomaly-detection";

export async function GET() {
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

  const anomalies = await getAnomaliesForUser(userId);

  return Response.json({
    success: true,
    anomalies,
  });
}
