"use client";

import { Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { getThreads } from "@/actions/chat";
import { cn } from "@/lib/utils";

type Thread = {
  id: string;
  title: string;
  createdAt: Date;
};

export function ThreadSelector({
  projectId,
  activeThreadId,
  onSelect,
  onNew,
}: {
  projectId: string | null;
  activeThreadId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}) {
  const [threads, setThreads] = useState<Thread[]>([]);

  const load = useCallback(async () => {
    const result = await getThreads(projectId ?? undefined);
    if (result.data) setThreads(result.data);
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="border-b border-neutral-800 px-4 py-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-neutral-500 font-medium">Threads</span>
        <button
          type="button"
          onClick={onNew}
          aria-label="New thread"
          className="text-neutral-500 hover:text-neutral-300"
        >
          <Plus className="size-3.5" />
        </button>
      </div>
      <div className="space-y-1 max-h-32 overflow-y-auto">
        {threads.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelect(t.id)}
            className={cn(
              "w-full text-left text-xs px-2 py-1 rounded truncate block hover:bg-neutral-800 transition-colors",
              activeThreadId === t.id ? "bg-[#7C5CFC]/20 text-[#7C5CFC]" : "text-neutral-400",
            )}
          >
            {t.title}
          </button>
        ))}
      </div>
    </div>
  );
}
