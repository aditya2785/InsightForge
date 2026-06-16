import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    await prisma.$queryRaw`SELECT NOW()`;

    return Response.json({
      success: true,
      message: "Aurora Connected Successfully"
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: String(error)
    });
  }
}
