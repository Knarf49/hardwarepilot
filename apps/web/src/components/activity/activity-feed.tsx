"use client";

import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDecisionStore } from "@/stores/decision-store";

const riskColors: Record<string, string> = {
  low: "bg-green-500/20 text-green-400 border-green-500/30",
  medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  high: "bg-red-500/20 text-red-400 border-red-500/30",
};

export function ActivityFeed({ projectId }: { projectId: string }) {
  const { decisions, proposals, updateProposalStatus } = useDecisionStore();

  const projectDecisions = decisions.filter((d) => d.projectId === projectId);
  const projectProposals = proposals.filter((p) => p.projectId === projectId);

  const allItems = [
    ...projectDecisions.map((d) => ({ kind: "decision" as const, ...d, timestamp: d.createdAt })),
    ...projectProposals.map((p) => ({ kind: "proposal" as const, ...p, timestamp: p.createdAt })),
  ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  if (allItems.length === 0) {
    return (
      <p className="text-neutral-500 text-sm text-center py-8">
        No activity yet. AI actions and proposals will appear here.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {allItems.map((item) => (
        <div
          key={item.id}
          className="rounded-lg border border-neutral-800 bg-neutral-900 p-3 text-sm"
        >
          {item.kind === "decision" ? (
            <>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={cn(
                    "text-xs px-1.5 py-0.5 rounded border",
                    item.actor === "ai"
                      ? "border-[#7C5CFC]/30 text-[#7C5CFC]"
                      : "border-neutral-600 text-neutral-400",
                  )}
                >
                  {item.actor}
                </span>
                <span className="text-xs text-neutral-500">
                  {item.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <p className="text-neutral-200">{item.decision}</p>
              <p className="text-neutral-500 text-xs mt-0.5">{item.reason}</p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={cn(
                    "text-xs px-1.5 py-0.5 rounded border",
                    riskColors[item.riskTier] ?? "border-neutral-600 text-neutral-400",
                  )}
                >
                  {item.riskTier}
                </span>
                <span className="text-xs text-neutral-500">{item.agentType}</span>
                <span
                  className={cn(
                    "text-xs ml-auto px-1.5 py-0.5 rounded",
                    item.status === "approved"
                      ? "bg-green-500/20 text-green-400"
                      : item.status === "rejected"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-neutral-700 text-neutral-400",
                  )}
                >
                  {item.status}
                </span>
              </div>
              <p className="text-neutral-200 font-medium">{item.title}</p>
              <p className="text-neutral-400 text-xs mt-0.5">{item.description}</p>
              <p className="text-neutral-500 text-xs mt-0.5">{item.reason}</p>
              {item.status === "pending" && (
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-green-400 border-green-500/30 hover:bg-green-500/10 text-xs h-7"
                    onClick={() => updateProposalStatus(item.id, "approved")}
                  >
                    <Check className="size-3 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-400 border-red-500/30 hover:bg-red-500/10 text-xs h-7"
                    onClick={() => updateProposalStatus(item.id, "rejected")}
                  >
                    <X className="size-3 mr-1" />
                    Reject
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}
