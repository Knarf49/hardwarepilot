import { describe, expect, test, vi } from "vitest";

vi.mock("@hardwarepilot/db", () => {
  const threads: Record<string, { id: string; title: string; projectId: string | null }> = {};
  let counter = 0;
  return {
    db: {
      thread: {
        create: vi.fn(async ({ data }: { data: { title: string; projectId?: string | null } }) => {
          const id = `t-${++counter}`;
          threads[id] = { id, title: data.title, projectId: data.projectId ?? null };
          return { id, title: data.title, createdAt: new Date(), updatedAt: new Date() };
        }),
        findMany: vi.fn(async ({ where }: { where: Record<string, unknown> }) => {
          const projectId = where?.projectId as string | null | undefined;
          return Object.values(threads)
            .filter((t) => t.projectId === (projectId ?? null))
            .map((t) => ({ ...t, createdAt: new Date() }));
        }),
        delete: vi.fn(async ({ where: { id } }: { where: { id: string } }) => {
          delete threads[id];
        }),
      },
    },
  };
});

function req(method: string, url: string, body?: unknown) {
  return new Request(url, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { "Content-Type": "application/json" } : undefined,
  });
}

describe("GET /api/threads", () => {
  test("returns empty when no threads", async () => {
    const { GET } = await import("./route");
    const res = await GET(req("GET", "http://localhost/api/threads"));
    expect(await res.json()).toEqual([]);
  });

  test("filters by projectId", async () => {
    const { POST, GET } = await import("./route");
    await POST(req("POST", "http://localhost/api/threads", { title: "Global" }));
    await POST(
      req("POST", "http://localhost/api/threads", {
        title: "Project A",
        projectId: "00000000-0000-0000-0000-000000000001",
      }),
    );
    const res = await GET(
      req("GET", "http://localhost/api/threads?projectId=00000000-0000-0000-0000-000000000001"),
    );
    const data = await res.json();
    expect(data).toHaveLength(1);
    expect(data[0].title).toBe("Project A");
  });
});

describe("DELETE /api/threads", () => {
  test("deletes a thread", async () => {
    const { POST, DELETE } = await import("./route");
    const createRes = await POST(
      req("POST", "http://localhost/api/threads", { title: "Delete me" }),
    );
    const { id } = await createRes.json();
    const delRes = await DELETE(req("DELETE", `http://localhost/api/threads?threadId=${id}`));
    const data = await delRes.json();
    expect(data.success).toBe(true);
  });

  test("returns 400 without threadId", async () => {
    const { DELETE } = await import("./route");
    const res = await DELETE(req("DELETE", "http://localhost/api/threads"));
    expect(res.status).toBe(400);
  });
});
