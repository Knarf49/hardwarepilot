import { describe, expect, test, vi } from "vitest";

vi.mock("@hardwarepilot/db", () => {
  const threads: Record<string, unknown[]> = {};
  const messages: Record<string, unknown[]> = {};
  let threadCounter = 0;
  let messageCounter = 0;

  return {
    db: {
      thread: {
        create: vi.fn(async ({ data }: { data: { projectId?: string; title: string } }) => {
          const id = `thread-${++threadCounter}`;
          threads[id] = [];
          return {
            id,
            projectId: data.projectId ?? null,
            title: data.title,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        }),
        findMany: vi.fn(async ({ where }: { where: { projectId?: string } }) => {
          return Object.entries(threads).map(([id]) => ({
            id,
            projectId: where.projectId ?? null,
            title: "Test Thread",
            createdAt: new Date(),
            updatedAt: new Date(),
          }));
        }),
        delete: vi.fn(async ({ where: { id } }: { where: { id: string } }) => {
          delete threads[id];
          delete messages[id];
        }),
        update: vi.fn(
          async ({ where: { id }, data }: { where: { id: string }; data: { title?: string } }) => {
            return { id, title: data.title ?? "Updated" };
          },
        ),
      },
      chatMessage: {
        create: vi.fn(
          async ({ data }: { data: { threadId: string; role: string; parts: unknown } }) => {
            const id = `msg-${++messageCounter}`;
            const msg = {
              id,
              threadId: data.threadId,
              role: data.role,
              parts: data.parts,
              createdAt: new Date(),
            };
            if (!messages[data.threadId]) messages[data.threadId] = [];
            messages[data.threadId].push(msg);
            return msg;
          },
        ),
        findMany: vi.fn(async ({ where }: { where: { threadId: string } }) => {
          return messages[where.threadId] || [];
        }),
      },
    },
  };
});

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("chat actions", () => {
  test("createThread returns an id", async () => {
    const { createThread } = await import("@/actions/chat");
    const result = await createThread(null, createFormData({ title: "New chat" }));
    expect(result.data?.id).toBeTruthy();
    expect(result.error).toBeNull();
  });

  test("getThreads returns list", async () => {
    const { createThread, getThreads } = await import("@/actions/chat");
    await createThread(null, createFormData({ title: "Chat 1" }));
    await createThread(null, createFormData({ title: "Chat 2" }));
    const result = await getThreads(undefined);
    expect(result.data?.length).toBeGreaterThanOrEqual(1);
    expect(result.error).toBeNull();
  });

  test("saveMessage returns an id", async () => {
    const { createThread, saveMessage } = await import("@/actions/chat");
    const thread = await createThread(null, createFormData({ title: "Test" }));
    const result = await saveMessage(
      null,
      createFormData({
        threadId: thread.data?.id ?? "",
        role: "user",
        parts: JSON.stringify([{ type: "text", text: "hello" }]),
      }),
    );
    expect(result.data?.id).toBeTruthy();
    expect(result.error).toBeNull();
  });

  test("loadMessages returns messages for thread", async () => {
    const { createThread, saveMessage, loadMessages } = await import("@/actions/chat");
    const thread = await createThread(null, createFormData({ title: "Test" }));
    await saveMessage(
      null,
      createFormData({
        threadId: thread.data?.id ?? "",
        role: "user",
        parts: JSON.stringify([{ type: "text", text: "hi" }]),
      }),
    );
    const result = await loadMessages(thread.data?.id ?? "");
    expect(result.data?.length).toBe(1);
    expect(result.error).toBeNull();
  });

  test("deleteThread removes thread", async () => {
    const { createThread, deleteThread, loadMessages } = await import("@/actions/chat");
    const thread = await createThread(null, createFormData({ title: "Delete me" }));
    await deleteThread(null, createFormData({ threadId: thread.data?.id ?? "" }));
    const result = await loadMessages(thread.data?.id ?? "");
    expect(result.data).toEqual([]);
    expect(result.error).toBeNull();
  });
});

function createFormData(obj: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(obj)) {
    fd.append(k, v);
  }
  return fd;
}
