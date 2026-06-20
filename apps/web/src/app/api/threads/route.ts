import { db } from "@hardwarepilot/db";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  projectId: z.string().uuid().optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId") || undefined;

  const threads = await db.thread.findMany({
    where: projectId ? { projectId } : { projectId: null },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, createdAt: true },
  });
  return Response.json(threads);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.message }, { status: 400 });
  }

  try {
    const thread = await db.thread.create({
      data: {
        title: parsed.data.title,
        projectId: parsed.data.projectId ?? null,
      },
    });
    return Response.json({ id: thread.id, title: thread.title, createdAt: thread.createdAt });
  } catch {
    return Response.json({ error: "Failed to create thread" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const threadId = searchParams.get("threadId");
  if (!threadId) {
    return Response.json({ error: "threadId required" }, { status: 400 });
  }

  try {
    await db.thread.delete({ where: { id: threadId } });
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Failed to delete thread" }, { status: 500 });
  }
}
