import { getCurrentUserId } from "@/lib/auth";
import { getForecastsForUser } from "@/lib/analytics/forecasting";

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

  const forecasts = await getForecastsForUser(userId);

  return Response.json({
    success: true,
    forecasts,
  });
}
