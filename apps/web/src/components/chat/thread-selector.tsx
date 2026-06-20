"use client";

import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Thread = {
  id: string;
  title: string;
  createdAt: string;
};

export function ThreadSelector({
  projectId,
  activeThreadId,
  refreshKey,
  onSelect,
  onNew,
}: {
  projectId?: string | null;
  activeThreadId: string | null;
  refreshKey: number;
  onSelect: (id: string) => void;
  onNew: () => void;
}) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const activeThread = threads.find((t) => t.id === activeThreadId);

  const load = useCallback(async () => {
    const url = projectId ? `/api/threads?projectId=${projectId}` : "/api/threads";
    const res = await fetch(url);
    if (res.ok) setThreads(await res.json());
  }, [projectId]);

  const handleDelete = useCallback(
    async (threadId: string) => {
      const res = await fetch(`/api/threads?threadId=${threadId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        if (activeThreadId === threadId) onSelect("");
        load();
      }
    },
    [load, activeThreadId, onSelect],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: refreshKey triggers re-fetch
  useEffect(() => {
    load();
  }, [load, refreshKey]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative border-b border-neutral-800 px-4 py-2">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex-1 flex items-center justify-between text-xs text-neutral-400 hover:text-neutral-200 py-1"
        >
          <span className="truncate">{activeThread?.title ?? "Select thread..."}</span>
          <ChevronDown className={cn("size-3 transition-transform", open && "rotate-180")} />
        </button>
        <button
          type="button"
          onClick={onNew}
          aria-label="New thread"
          className="text-neutral-500 hover:text-neutral-300 p-0.5"
        >
          <Plus className="size-3.5" />
        </button>
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full z-10 mt-1 mx-4 bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl max-h-48 overflow-y-auto">
          {threads.length === 0 ? (
            <p className="text-xs text-neutral-500 px-3 py-4 text-center">No threads yet</p>
          ) : (
            threads.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  onSelect(t.id);
                  setOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between text-left text-xs px-3 py-2 hover:bg-neutral-800 transition-colors group",
                  t.id === activeThreadId && "bg-[#7C5CFC]/20",
                )}
              >
                <span className="truncate flex-1">{t.title}</span>
                {/* biome-ignore lint/a11y/useSemanticElements: nested button unavoidable for delete inside thread row */}
                {/* biome-ignore lint/a11y/useKeyWithClickEvents: delete also reachable via parent button */}
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(t.id);
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label="Delete thread"
                  className="text-neutral-600 hover:text-red-400 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:!opacity-100 transition-opacity ml-1 shrink-0"
                >
                  <Trash2 className="size-3" />
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
