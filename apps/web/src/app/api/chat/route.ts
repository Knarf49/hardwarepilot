import { intentAgent } from "@hardwarepilot/agents";
import { createAgentUIStreamResponse } from "ai";

export async function POST(request: Request) {
  const { messages } = await request.json();

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return Response.json(
      { error: "messages array is required and must not be empty" },
      { status: 400 },
    );
  }

  return createAgentUIStreamResponse({
    agent: intentAgent,
    uiMessages: messages,
  });
}
