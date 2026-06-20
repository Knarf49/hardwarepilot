import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { streamText } from "ai";
import { createChatTools } from "@/lib/chat-tools";

const apiKey = process.env.OPENCODE_API_KEY;
if (!apiKey) throw new Error("OPENCODE_API_KEY environment variable is not set");
const opencode = createOpenAICompatible({
  name: "opencode-go",
  baseURL: "https://opencode.ai/zen/go/v1",
  apiKey,
});

const SYSTEM_PROMPT = `You are HardwarePilot's AI assistant. You help users design hardware products.

You have tools to:
- Read project state (getProjectState)
- Create modules (createModule) 
- Add components (createComponent)
- Add constraints (addConstraint)
- Generate SPICE netlists (generateNetlist)

When the user asks you to do something, use the appropriate tool. Be concise.`;

export async function POST(request: Request) {
  const body = await request.json();
  const messages = body.messages as {
    id: string;
    role: string;
    parts: { type: string; text?: string }[];
  }[];
  const projectId = body.projectId as string | undefined;

  if (!messages?.length) {
    return Response.json({ error: "empty" }, { status: 400 });
  }

  const converted = messages.map((m) => ({
    role: m.role,
    content: m.parts
      .filter((p) => p.type === "text")
      .map((p) => p.text)
      .join("\n"),
  }));

  const tools = projectId ? createChatTools(projectId) : {};

  const result = streamText({
    model: opencode("deepseek-v4-flash"),
    system: SYSTEM_PROMPT,
    messages: converted,
    tools,
    maxSteps: 10,
  });

  return result.toUIMessageStreamResponse();
}
