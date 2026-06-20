import { describe, expect, test } from "vitest";
import { useChatStore } from "./chat-store";

describe("chatStore", () => {
  test("starts closed with no active thread", () => {
    const state = useChatStore.getState();
    expect(state.isOpen).toBe(false);
    expect(state.activeThreadId).toBeNull();
  });

  test("toggle opens and closes dock", () => {
    const { toggle } = useChatStore.getState();
    toggle();
    expect(useChatStore.getState().isOpen).toBe(true);
    toggle();
    expect(useChatStore.getState().isOpen).toBe(false);
  });

  test("setActiveThreadId updates thread", () => {
    useChatStore.getState().setActiveThreadId("thread-1");
    expect(useChatStore.getState().activeThreadId).toBe("thread-1");
    useChatStore.getState().setActiveThreadId(null);
    expect(useChatStore.getState().activeThreadId).toBeNull();
  });
});
