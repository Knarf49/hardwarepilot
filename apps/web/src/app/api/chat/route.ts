import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { convertToModelMessages, stepCountIs, streamText } from "ai";
import { createTools } from "@/lib/chat-tools";

const apiKey = process.env.OPENCODE_API_KEY;
if (!apiKey) throw new Error("OPENCODE_API_KEY environment variable is not set");

const provider = createOpenAICompatible({
  name: "opencode-go",
  baseURL: "https://opencode.ai/zen/go/v1",
  apiKey,
});

const BASE_SYSTEM = `You are HardwarePilot's AI assistant. Help users design hardware products (PCBs, enclosures, assemblies). Be concise and technical.

When you call a tool, always summarize what happened in plain language afterward. If a tool fails, explain the failure clearly and suggest a fix.`;

const SYSTEM_NO_TOOLS = `${BASE_SYSTEM}

You are in a global context with no project loaded, so no tools are available. Help the user with general hardware design questions, or tell them to open a project to enable project tools.`;

const SYSTEM_WITH_TOOLS = `${BASE_SYSTEM}

Tools are available for the currently open project. Use them whenever the user asks to inspect or modify the project. Prefer calling a tool over guessing project state.`;

export async function POST(request: Request) {
  const body = await request.json();
  const messages = body.messages;
  const projectId = body.projectId as string | undefined;

  if (!messages?.length) {
    return Response.json({ error: "empty" }, { status: 400 });
  }

  const tools = projectId ? createTools(projectId) : undefined;
  const system = projectId ? SYSTEM_WITH_TOOLS : SYSTEM_NO_TOOLS;

  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: provider("deepseek-v4-pro"),
    system,
    messages: modelMessages,
    tools,
    temperature: 0.7,
    maxRetries: 2,
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
}
