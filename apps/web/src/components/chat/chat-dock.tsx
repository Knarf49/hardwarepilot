"use client";

import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { TextStreamChatTransport } from "ai";
import { MessageSquare, Send, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createThread, loadMessages, saveMessage } from "@/actions/chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/stores/chat-store";
import { ThreadSelector } from "./thread-selector";

export function ChatDock({ projectId }: { projectId?: string }) {
  const { isOpen, activeThreadId, toggle, close, setActiveThreadId } = useChatStore();
  const [input, setInput] = useState("");
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  const transport = useMemo(() => new TextStreamChatTransport({ api: "/api/chat" }), []);

  const { messages, sendMessage, status } = useChat({
    transport,
    messages: initialMessages,
  });

  useEffect(() => {
    if (activeThreadId) {
      loadMessages(activeThreadId).then((result) => {
        if (result.data) setInitialMessages(result.data as UIMessage[]);
      });
    } else {
      setInitialMessages([]);
    }
  }, [activeThreadId]);

  const persistMessage = useCallback(
    (role: string, parts: unknown) => {
      if (!activeThreadId) return;
      const fd = new FormData();
      fd.append("threadId", activeThreadId);
      fd.append("role", role);
      fd.append("parts", JSON.stringify(parts));
      saveMessage(null, fd);
    },
    [activeThreadId],
  );

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const parts = [{ type: "text", text: trimmed }];
    persistMessage("user", parts);
    sendMessage({ text: trimmed });
    setInput("");
  }, [input, sendMessage, persistMessage]);

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last && last.role === "assistant" && status === "ready") {
      persistMessage("assistant", last.parts);
    }
  }, [messages, status, persistMessage]);

  const handleNewThread = useCallback(async () => {
    const fd = new FormData();
    fd.append("title", "New Chat");
    if (projectId) fd.append("projectId", projectId);
    const result = await createThread(null, fd);
    if (result.data) setActiveThreadId(result.data.id);
  }, [projectId, setActiveThreadId]);

  const handleSelectThread = useCallback(
    (id: string) => {
      setActiveThreadId(id);
    },
    [setActiveThreadId],
  );

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        aria-label="Open AI assistant"
        className={cn(
          "fixed bottom-6 right-6 z-50 rounded-full p-3 shadow-lg transition-all",
          "bg-[#7C5CFC] text-white hover:bg-[#6B4FE0]",
          isOpen && "scale-0 opacity-0 pointer-events-none",
        )}
      >
        <MessageSquare className="size-5" />
      </button>

      {isOpen && (
        <div className="fixed top-0 right-0 z-50 h-full w-96 flex flex-col border-l border-neutral-800 bg-neutral-950 shadow-2xl">
          <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
            <h2 className="font-semibold text-sm text-neutral-200">AI Assistant</h2>
            <button
              type="button"
              onClick={close}
              aria-label="Close AI assistant"
              className="rounded-md p-1 text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800"
            >
              <X className="size-4" />
            </button>
          </div>

          <ThreadSelector
            projectId={projectId ?? null}
            activeThreadId={activeThreadId}
            onSelect={handleSelectThread}
            onNew={handleNewThread}
          />

          <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <p className="text-neutral-500 text-sm text-center mt-8">
                Ask me anything about your hardware design.
              </p>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                  msg.role === "user"
                    ? "ml-auto bg-[#7C5CFC]/20 text-neutral-200"
                    : "mr-auto bg-neutral-800 text-neutral-100",
                )}
              >
                {msg.parts?.map((part, i) => {
                  if (part.type === "text") {
                    // biome-ignore lint/suspicious/noArrayIndexKey: parts are immutable, order stable
                    return <span key={`${msg.id}-${i}`}>{part.text}</span>;
                  }
                  return null;
                })}
              </div>
            ))}
            {(status === "submitted" || status === "streaming") && (
              <div className="mr-auto bg-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-400">
                Thinking...
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="border-t border-neutral-800 p-3 flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your design..."
              className="flex-1"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!input.trim() || status === "submitted" || status === "streaming"}
            >
              <Send className="size-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
