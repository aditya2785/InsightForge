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
Analyze this business dataset and provide ONLY data-driven insights.

Rules:
- Use actual numbers from the data.
- Mention forecast values when available.
- Mention anomalies when available.
- Mention the top-performing products.
- Mention risks if inventory, customers, or revenue trends look weak.
- Do not give generic advice.
- Keep response under 250 words.

Output Format:

📈 Key Insights
- ...

⚠️ Risks
- ...

🚀 Opportunities
- ...

✅ Recommended Actions
- ...

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
