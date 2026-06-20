import { db } from "@hardwarepilot/db";
import { z } from "zod";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const threadId = searchParams.get("threadId");
  if (!threadId) {
    return Response.json({ error: "threadId required" }, { status: 400 });
  }

  try {
    const messages = await db.chatMessage.findMany({
      where: { threadId },
      orderBy: { createdAt: "asc" },
    });
    return Response.json(messages);
  } catch {
    return Response.json({ error: "Failed to load" }, { status: 500 });
  }
}

const saveSchema = z.object({
  threadId: z.string(),
  role: z.enum(["user", "assistant"]),
  parts: z.array(z.object({ type: z.string(), text: z.string().optional() })),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = saveSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.message }, { status: 400 });
  }

  try {
    const msg = await db.chatMessage.create({
      data: {
        threadId: parsed.data.threadId,
        role: parsed.data.role,
        parts: parsed.data.parts,
      },
    });
    return Response.json({ id: msg.id });
  } catch {
    return Response.json({ error: "Failed to save" }, { status: 500 });
  }
}
