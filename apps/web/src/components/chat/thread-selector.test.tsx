import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { ThreadSelector } from "./thread-selector";

vi.mock("@/actions/chat", () => ({
  getThreads: async () => ({
    data: [
      { id: "t1", title: "Design discussion", createdAt: new Date() },
      { id: "t2", title: "Circuit questions", createdAt: new Date() },
    ],
    error: null,
  }),
  createThread: vi.fn(),
  deleteThread: vi.fn(),
}));

describe("ThreadSelector", () => {
  test("shows threads after loading", async () => {
    render(
      <ThreadSelector projectId={null} activeThreadId={null} onSelect={vi.fn()} onNew={vi.fn()} />,
    );
    expect(await screen.findByText("Design discussion")).toBeInTheDocument();
    expect(screen.getByText("Circuit questions")).toBeInTheDocument();
  });

  test("calls onSelect when thread clicked", async () => {
    const onSelect = vi.fn();
    render(
      <ThreadSelector projectId={null} activeThreadId={null} onSelect={onSelect} onNew={vi.fn()} />,
    );
    const btn = await screen.findByText("Design discussion");
    btn.click();
    expect(onSelect).toHaveBeenCalledWith("t1");
  });

  test("shows new thread button", async () => {
    const onNew = vi.fn();
    render(
      <ThreadSelector projectId={null} activeThreadId={null} onSelect={vi.fn()} onNew={onNew} />,
    );
    const newBtn = screen.getByRole("button", { name: /new thread/i });
    newBtn.click();
    expect(onNew).toHaveBeenCalled();
  });
});
