import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { ThreadSelector } from "./thread-selector";

const defaultProps = {
  projectId: null as string | null,
  activeThreadId: null as string | null,
  refreshKey: 0,
  onSelect: vi.fn(),
  onNew: vi.fn(),
};

describe("ThreadSelector", () => {
  test("shows placeholder when no active thread", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    } as Response);
    render(<ThreadSelector {...defaultProps} />);
    expect(await screen.findByText("Select thread...")).toBeInTheDocument();
  });

  test("shows active thread title", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: "t1", title: "Design discussion", createdAt: new Date().toISOString() },
      ],
    } as Response);
    render(<ThreadSelector {...defaultProps} activeThreadId="t1" />);
    expect(await screen.findByText("Design discussion")).toBeInTheDocument();
  });

  test("opens dropdown on click and shows threads", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: "t1", title: "Design discussion", createdAt: new Date().toISOString() },
        { id: "t2", title: "Circuit questions", createdAt: new Date().toISOString() },
      ],
    } as Response);
    render(<ThreadSelector {...defaultProps} />);
    await user.click(await screen.findByText("Select thread..."));
    expect(screen.getByText("Circuit questions")).toBeInTheDocument();
  });

  test("calls onSelect when thread clicked", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: "t1", title: "Design discussion", createdAt: new Date().toISOString() },
      ],
    } as Response);
    const onSelect = vi.fn();
    render(<ThreadSelector {...defaultProps} onSelect={onSelect} />);
    await user.click(await screen.findByText("Select thread..."));
    await user.click(screen.getByText("Design discussion"));
    expect(onSelect).toHaveBeenCalledWith("t1");
  });

  test("calls onNew when plus clicked", async () => {
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

  test("shows delete button in dropdown", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: "t1", title: "Delete me", createdAt: new Date().toISOString() }],
    } as Response);
    render(<ThreadSelector {...defaultProps} />);
    await user.click(await screen.findByText("Select thread..."));
    expect(screen.getByLabelText("Delete thread")).toBeInTheDocument();
  });
});
