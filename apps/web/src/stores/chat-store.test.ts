import { describe, expect, test } from "vitest";
import { useChatStore } from "./chat-store";

describe("chatStore", () => {
  test("starts closed", () => {
    expect(useChatStore.getState().isOpen).toBe(false);
  });

  test("starts with empty messages", () => {
    expect(useChatStore.getState().messages).toEqual([]);
  });

  test("toggle opens and closes dock", () => {
    const { toggle } = useChatStore.getState();
    toggle();
    expect(useChatStore.getState().isOpen).toBe(true);
    toggle();
    expect(useChatStore.getState().isOpen).toBe(false);
  });

  test("addMessage appends a message", () => {
    const { addMessage } = useChatStore.getState();
    addMessage({ role: "user" as const, content: "hello" });
    const messages = useChatStore.getState().messages;
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({ role: "user", content: "hello" });
    expect(messages[0].id).toBeTruthy();
  });

  test("clear empties messages", () => {
    const { addMessage, clear } = useChatStore.getState();
    addMessage({ role: "user" as const, content: "hello" });
    addMessage({ role: "assistant" as const, content: "hi" });
    clear();
    expect(useChatStore.getState().messages).toEqual([]);
  });

  test("clear resets isOpen", () => {
    const { toggle, clear } = useChatStore.getState();
    toggle();
    clear();
    expect(useChatStore.getState().isOpen).toBe(false);
  });

  test("messages persist across getState calls", () => {
    useChatStore.getState().addMessage({ role: "user" as const, content: "test" });
    expect(useChatStore.getState().messages).toHaveLength(1);
  });
});
