import { describe, expect, test } from "vitest";
import { useChatStore } from "./chat-store";

describe("chatStore", () => {
  test("starts closed", () => {
    expect(useChatStore.getState().isOpen).toBe(false);
  });

  test("toggle opens and closes dock", () => {
    const { toggle } = useChatStore.getState();
    toggle();
    expect(useChatStore.getState().isOpen).toBe(true);
    toggle();
    expect(useChatStore.getState().isOpen).toBe(false);
  });

  test("open sets isOpen to true", () => {
    const { open } = useChatStore.getState();
    open();
    expect(useChatStore.getState().isOpen).toBe(true);
  });

  test("close sets isOpen to false", () => {
    const { open, close } = useChatStore.getState();
    open();
    close();
    expect(useChatStore.getState().isOpen).toBe(false);
  });
});
