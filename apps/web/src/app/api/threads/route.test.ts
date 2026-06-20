import { describe, expect, test, vi } from "vitest";

vi.mock("@hardwarepilot/db", () => {
  const threads: Record<string, { id: string; title: string }> = {};
  let counter = 0;
  return {
    db: {
      thread: {
        create: vi.fn(async ({ data }: { data: { title: string; projectId?: string | null } }) => {
          const id = `t-${++counter}`;
          threads[id] = { id, title: data.title };
          return { id, title: data.title, createdAt: new Date(), updatedAt: new Date() };
        }),
        findMany: vi.fn(async () => {
          return Object.values(threads).map((t) => ({ ...t, createdAt: new Date() }));
        }),
      },
    },
  };
});

describe("GET /api/threads", () => {
  test("returns empty array when no threads", async () => {
    const { GET } = await import("./route");
    const response = await GET();
    const data = await response.json();
    expect(data).toEqual([]);
  });
});

describe("POST /api/threads", () => {
  test("creates a thread and returns it", async () => {
    const { POST } = await import("./route");
    const request = new Request("http://localhost/api/threads", {
      method: "POST",
      body: JSON.stringify({ title: "Test Thread" }),
      headers: { "Content-Type": "application/json" },
    });
    const response = await POST(request);
    const data = await response.json();
    expect(data.id).toBeTruthy();
    expect(data.title).toBe("Test Thread");
  });

  test("returns 400 for empty title", async () => {
    const { POST } = await import("./route");
    const request = new Request("http://localhost/api/threads", {
      method: "POST",
      body: JSON.stringify({ title: "" }),
      headers: { "Content-Type": "application/json" },
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
