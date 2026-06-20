"use server";

import { db } from "@hardwarepilot/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

type ActionResult<T> =
  | { data: T; error: null }
  | { data: null; error: { code: string; message: string } };

const createThreadSchema = z.object({
  projectId: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
});

const threadIdSchema = z.object({
  threadId: z.string(),
});

const saveMessageSchema = z.object({
  threadId: z.string(),
  role: z.enum(["user", "assistant"]),
  parts: z.string(),
});

export async function createThread(
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const raw = Object.fromEntries(formData);
  const parsed = createThreadSchema.safeParse({
    ...raw,
    projectId: raw.projectId || undefined,
  });

  if (!parsed.success) {
    return { data: null, error: { code: "VALIDATION", message: parsed.error.message } };
  }

  try {
    const thread = await db.thread.create({
      data: {
        projectId: parsed.data.projectId ?? null,
        title: parsed.data.title,
      },
    });
    revalidatePath("/");
    return { data: { id: thread.id }, error: null };
  } catch {
    return { data: null, error: { code: "DB_ERROR", message: "Failed to create thread" } };
  }
}

export async function getThreads(
  projectId?: string,
): Promise<ActionResult<{ id: string; title: string; createdAt: Date }[]>> {
  try {
    const threads = await db.thread.findMany({
      where: projectId ? { projectId } : { projectId: null },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, createdAt: true },
    });
    return { data: threads, error: null };
  } catch {
    return { data: null, error: { code: "DB_ERROR", message: "Failed to load threads" } };
  }
}

export async function saveMessage(
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const parsed = saveMessageSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { data: null, error: { code: "VALIDATION", message: parsed.error.message } };
  }

  try {
    const message = await db.chatMessage.create({
      data: {
        threadId: parsed.data.threadId,
        role: parsed.data.role,
        parts: JSON.parse(parsed.data.parts),
      },
    });
    return { data: { id: message.id }, error: null };
  } catch {
    return { data: null, error: { code: "DB_ERROR", message: "Failed to save message" } };
  }
}

export async function loadMessages(
  threadId: string,
): Promise<
  ActionResult<{ id: string; threadId: string; role: string; parts: unknown; createdAt: Date }[]>
> {
  try {
    const messages = await db.chatMessage.findMany({
      where: { threadId },
      orderBy: { createdAt: "asc" },
    });
    return { data: messages, error: null };
  } catch {
    return { data: null, error: { code: "DB_ERROR", message: "Failed to load messages" } };
  }
}

export async function deleteThread(
  _prev: ActionResult<unknown> | null,
  formData: FormData,
): Promise<ActionResult<{ success: boolean }>> {
  const parsed = threadIdSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { data: null, error: { code: "VALIDATION", message: parsed.error.message } };
  }

  try {
    await db.thread.delete({ where: { id: parsed.data.threadId } });
    revalidatePath("/");
    return { data: { success: true }, error: null };
  } catch {
    return { data: null, error: { code: "DB_ERROR", message: "Failed to delete thread" } };
  }
}

export async function updateThreadTitle(
  _prev: ActionResult<unknown> | null,
  formData: FormData,
): Promise<ActionResult<{ success: boolean }>> {
  const parsed = z
    .object({ threadId: z.string(), title: z.string().min(1) })
    .safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { data: null, error: { code: "VALIDATION", message: parsed.error.message } };
  }

  try {
    await db.thread.update({
      where: { id: parsed.data.threadId },
      data: { title: parsed.data.title },
    });
    return { data: { success: true }, error: null };
  } catch {
    return { data: null, error: { code: "DB_ERROR", message: "Failed to update title" } };
  }
}
