import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { streamText } from "ai";

const apiKey = process.env.OPENCODE_API_KEY;
if (!apiKey) throw new Error("OPENCODE_API_KEY environment variable is not set");
const opencode = createOpenAICompatible({
  name: "opencode-go",
  baseURL: "https://opencode.ai/zen/go/v1",
  apiKey,
});

export async function POST(request: Request) {
  const { messages } = await request.json();

  if (!messages?.length) {
    return Response.json({ error: "empty" }, { status: 400 });
  }

  const converted = messages.map(
    (m: { role: string; parts: { type: string; text?: string }[] }) => ({
      role: m.role,
      content: m.parts
        .filter((p) => p.type === "text")
        .map((p) => p.text)
        .join("\n"),
    }),
  );

  const result = streamText({
    model: opencode("deepseek-v4-flash"),
    messages: converted,
  });

  return result.toTextStreamResponse();
}
