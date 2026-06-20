import { describe, expect, test } from "vitest";

describe("POST /api/chat", () => {
  test("route handler exists and is POST", async () => {
    const { POST } = await import("./route");
    expect(POST).toBeDefined();
    expect(typeof POST).toBe("function");
  });

  test("returns 400 for empty messages", async () => {
    const { POST } = await import("./route");
    const request = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({ messages: [] }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
