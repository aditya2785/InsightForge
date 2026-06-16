import { GoogleGenerativeAI } from "@google/generative-ai";
import { getCurrentUserId } from "@/lib/auth";

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY!
);

export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return Response.json(
        {
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const body = await req.json();

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const prompt = `
You are a senior business analyst. But do not mention it

Analyze the following business metrics and provide:

1. Key Insights
2. Risks
3. Opportunities
4. Actionable Recommendations

and keep it short like summary insights.

Business Data:

${JSON.stringify(body, null, 2)}
`;

    const result =
      await model.generateContent(prompt);

    const response =
      result.response.text();

    return Response.json({
      insights: response,
    });

  } catch {
    return Response.json(
      { error: "Failed to generate insights" },
      { status: 500 }
    );
  }
}
