import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { ThreadSelector } from "./thread-selector";

const defaultProps = {
  activeThreadId: null as string | null,
  refreshKey: 0,
  onSelect: vi.fn(),
  onNew: vi.fn(),
};

describe("ThreadSelector", () => {
  test("shows threads after loading", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: "t1", title: "Design discussion", createdAt: new Date().toISOString() },
        { id: "t2", title: "Circuit questions", createdAt: new Date().toISOString() },
      ],
    } as Response);
    render(<ThreadSelector {...defaultProps} />);
    expect(await screen.findByText("Design discussion")).toBeInTheDocument();
    expect(screen.getByText("Circuit questions")).toBeInTheDocument();
  });

  test("calls onSelect when thread clicked", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: "t1", title: "Design discussion", createdAt: new Date().toISOString() },
      ],
    } as Response);
    const onSelect = vi.fn();
    render(<ThreadSelector {...defaultProps} onSelect={onSelect} />);
    const btn = await screen.findByText("Design discussion");
    btn.click();
    expect(onSelect).toHaveBeenCalledWith("t1");
  });

  test("shows new thread button", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    } as Response);
    const onNew = vi.fn();
    render(<ThreadSelector {...defaultProps} onNew={onNew} />);
    const newBtn = screen.getByRole("button", { name: /new thread/i });
    newBtn.click();
    expect(onNew).toHaveBeenCalled();
  });
});
