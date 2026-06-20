"use client";

import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { DefaultChatTransport } from "ai";
import { MessageSquare, Send, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/stores/chat-store";
import { ThreadSelector } from "./thread-selector";

async function saveMsg(threadId: string, role: string, parts: unknown) {
  await fetch("/api/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ threadId, role, parts }),
  });
}

async function loadMsgs(threadId: string) {
  const res = await fetch(`/api/messages?threadId=${threadId}`);
  if (res.ok) return (await res.json()) as UIMessage[];
  return [];
}

export function ChatDock({ projectId }: { projectId?: string }) {
  const { isOpen, activeThreadId, toggle, close, setActiveThreadId } = useChatStore();
  const [refreshKey, setRefreshKey] = useState(0);
  const titleSetRef = useRef(new Set<string>());

  const handleSend = useCallback(
    (text: string) => {
      if (!activeThreadId) return;
      saveMsg(activeThreadId, "user", [{ type: "text", text }]);
      if (!titleSetRef.current.has(activeThreadId)) {
        titleSetRef.current.add(activeThreadId);
        const title = text.length > 60 ? `${text.slice(0, 57)}...` : text;
        fetch("/api/threads", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ threadId: activeThreadId, title }),
        }).then(() => setRefreshKey((k) => k + 1));
      }
    },
    [activeThreadId],
  );

  const handleNewThread = useCallback(async () => {
    const body: Record<string, string> = { title: "New Chat" };
    if (projectId) body.projectId = projectId;
    const res = await fetch("/api/threads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const data = await res.json();
      setActiveThreadId(data.id);
      setRefreshKey((k) => k + 1);
    }
  }, [projectId, setActiveThreadId]);

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
            refreshKey={refreshKey}
            onSelect={setActiveThreadId}
            onNew={handleNewThread}
          />

          <ChatMessages
            key={activeThreadId ?? "no-thread"}
            threadId={activeThreadId}
            projectId={projectId}
            onSend={handleSend}
          />
        </div>
      )}
    </>
  );
}

function ChatMessages({
  threadId,
  projectId,
  onSend,
}: {
  threadId: string | null;
  projectId?: string;
  onSend: (text: string) => void;
}) {
  const [input, setInput] = useState("");
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef(false);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: projectId ? { projectId } : undefined,
      }),
    [projectId],
  );

  const { messages, sendMessage, status, setMessages } = useChat({
    transport,
    messages: initialMessages,
  });

  useEffect(() => {
    if (threadId) {
      loadedRef.current = false;
      loadMsgs(threadId).then((msgs) => {
        if (!loadedRef.current) {
          setInitialMessages(msgs);
          setMessages(msgs);
          loadedRef.current = true;
        }
      });
    } else {
      setInitialMessages([]);
      setMessages([]);
    }
  }, [threadId, setMessages]);

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last && last.role === "assistant" && status === "ready" && threadId) {
      saveMsg(threadId, "assistant", last.parts);
    }
  }, [messages, status, threadId]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = input.trim();
      if (!trimmed) return;
      onSend(trimmed);
      sendMessage({ text: trimmed });
      setInput("");
    },
    [input, sendMessage, onSend],
  );

  return (
    <>
      <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-neutral-500 text-sm text-center mt-8">
            {threadId
              ? "Ask me anything about your hardware design."
              : "Create a new thread to start chatting."}
          </p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "max-w-[85%] rounded-lg px-3 py-2 text-sm",
              msg.role === "user"
                ? "ml-auto bg-[#7C5CFC]/20 text-neutral-200"
                : "mr-auto bg-neutral-800 text-neutral-100 prose prose-invert prose-sm max-w-none",
            )}
          >
            {msg.parts?.map((part, i) => {
              if (
                part.type === "step-start" ||
                part.type === "tool-invocation" ||
                part.type?.startsWith("reasoning")
              ) {
                return null;
              }
              if (part.type === "text" && part.text) {
                if (msg.role === "assistant") {
                  return (
                    // biome-ignore lint/suspicious/noArrayIndexKey: parts immutable
                    <ReactMarkdown key={i}>{part.text}</ReactMarkdown>
                  );
                }
                // biome-ignore lint/suspicious/noArrayIndexKey: parts immutable
                return <span key={i}>{part.text}</span>;
              }
              const text = (part as { text?: string }).text;
              if (text) {
                if (msg.role === "assistant") {
                  return (
                    // biome-ignore lint/suspicious/noArrayIndexKey: parts immutable
                    <ReactMarkdown key={i}>{text}</ReactMarkdown>
                  );
                }
                // biome-ignore lint/suspicious/noArrayIndexKey: parts immutable
                return <span key={i}>{text}</span>;
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

      <form onSubmit={handleSubmit} className="border-t border-neutral-800 p-3 flex gap-2">
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
    </>
  );
}
