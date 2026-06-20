import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { createTools } from "@/lib/chat-tools";

const apiKey = process.env.OPENCODE_API_KEY;
if (!apiKey) throw new Error("OPENCODE_API_KEY environment variable is not set");

const TOOL_SYSTEM = `You are HardwarePilot's AI assistant. Help users design hardware products.

When you need to use a tool, call it like this:
<getProjectState></getProjectState>
<createModule>{"name":"Battery","type":"battery","ports":[{"name":"VOUT","direction":"out","voltage":3.7}]}</createModule>
<createComponent>{"moduleId":"...","name":"10k Resistor","type":"resistor","value":"10k"}</createComponent>
<addConstraint>{"domain":"mechanical","rule":"Board must fit 80x50mm","priority":"must"}</addConstraint>
<generateNetlist></generateNetlist>

After using a tool, ALWAYS explain the results clearly. Never just show raw tool output.
If no tool is needed, reply in natural language. Be concise.`;

export async function POST(request: Request) {
  const body = await request.json();
  const messages = body.messages as {
    role: string;
    parts: { type: string; text?: string }[];
  }[];
  const projectId = body.projectId as string | undefined;

  if (!messages?.length) {
    return Response.json({ error: "empty" }, { status: 400 });
  }

  const lastMsg = messages[messages.length - 1];
  const userText = lastMsg.parts
    .filter((p) => p.type === "text")
    .map((p) => p.text)
    .join("\n");

  const model = new ChatOpenAI({
    modelName: "deepseek-v4-pro",
    temperature: 0.7,
    configuration: {
      baseURL: "https://opencode.ai/zen/go/v1",
      apiKey,
    },
  });

  const tools = projectId ? createTools(projectId) : [];
  const toolMap = new Map<string, (typeof tools)[number]>(tools.map((t) => [t.name, t]));

  const firstResponse = await model.invoke([
    new SystemMessage(TOOL_SYSTEM),
    new HumanMessage(userText),
  ]);

  const content = typeof firstResponse.content === "string" ? firstResponse.content : "";

  const toolRegex = /<(\w+)>([\s\S]*?)<\/\1>/g;
  let match: RegExpExecArray | null;
  const toolCalls: { name: string; args: string }[] = [];

  // biome-ignore lint/suspicious/noAssignInExpressions: regex exec loop pattern
  while ((match = toolRegex.exec(content)) !== null) {
    toolCalls.push({ name: match[1], args: match[2].trim() || "{}" });
  }

  let finalContent = content;

  if (toolCalls.length > 0) {
    const toolResults: string[] = [];
    for (const tc of toolCalls) {
      const tool = toolMap.get(tc.name);
      if (tool) {
        const maxRetries = 2;
        let lastError: unknown;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            const args = JSON.parse(tc.args);
            const invoke = tool.invoke as unknown as (args: unknown) => Promise<string>;
            const result = await invoke(args);
            toolResults.push(`${tc.name} result: ${result}`);
            lastError = null;
            break;
          } catch (e) {
            lastError = e;
            if (attempt < maxRetries) {
              await new Promise((r) => setTimeout(r, 500));
            }
          }
        }
        if (lastError) {
          toolResults.push(
            `${tc.name} failed after ${maxRetries + 1} attempts: ${String(lastError)}`,
          );
        }
      } else {
        toolResults.push(`${tc.name}: unknown tool`);
      }
    }
    const toolContext = toolResults.join("\n");
    const followUp = await model.invoke([
      new SystemMessage(TOOL_SYSTEM),
      new HumanMessage(userText),
      firstResponse,
      new SystemMessage(
        `Tools executed. Results:\n${toolContext}\n\nProvide a clear summary of what was done/found.`,
      ),
    ]);
    finalContent = typeof followUp.content === "string" ? followUp.content : finalContent;
  }

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    start(controller) {
      const enq = (data: string) => controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      enq('{"type":"start"}');
      enq('{"type":"start-step"}');
      enq('{"type":"text-start","id":"txt-0"}');
      enq(`{"type":"text-delta","id":"txt-0","delta":${JSON.stringify(finalContent)}}`);
      enq('{"type":"text-end","id":"txt-0"}');
      enq('{"type":"finish-step"}');
      enq('{"type":"finish","finishReason":"stop"}');
      enq("[DONE]");
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "x-vercel-ai-data-stream": "v1",
    },
  });
}
