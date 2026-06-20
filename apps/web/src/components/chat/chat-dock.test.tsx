import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { ChatDock } from "./chat-dock";

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
