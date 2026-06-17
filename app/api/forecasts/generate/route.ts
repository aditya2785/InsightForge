import { getCurrentUserId } from "@/lib/auth";
import { generateForecastsForUser } from "@/lib/analytics/forecasting";

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

  const forecasts = await generateForecastsForUser(userId);

  return Response.json({
    success: true,
    forecasts,
  });
}
