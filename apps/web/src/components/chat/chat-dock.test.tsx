import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { ChatDock } from "./chat-dock";

vi.mock("@ai-sdk/react", () => ({
  useChat: () => ({
    messages: [],
    sendMessage: vi.fn(),
    status: "ready",
  }),
}));

vi.mock("ai", () => ({
  TextStreamChatTransport: vi.fn(),
}));

vi.mock("@/actions/chat", () => ({
  getThreads: async () => ({ data: [], error: null }),
  loadMessages: async () => ({ data: [], error: null }),
  saveMessage: vi.fn(),
  createThread: vi.fn(),
}));

describe("ChatDock", () => {
  test("renders toggle button when closed", () => {
    render(<ChatDock />);
    expect(screen.getByRole("button", { name: /open ai assistant/i })).toBeInTheDocument();
  });

  test("does not render chat panel when closed", () => {
    render(<ChatDock />);
    expect(screen.queryByPlaceholderText(/ask/i)).not.toBeInTheDocument();
  });
});
