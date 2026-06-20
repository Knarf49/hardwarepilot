"use client";

import type { ModuleModel } from "@hardwarepilot/db";
import { ArrowRight, Cpu, Trash2 } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { deleteModule } from "@/actions/module";
import { Button } from "@/components/ui/button";

interface ModuleCardProps {
  module: ModuleModel;
  projectId: string;
}

function DeleteButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="ghost"
      size="icon"
      disabled={pending}
      className="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-600 hover:text-red-400"
    >
      <Trash2 className="w-4 h-4" />
    </Button>
  );
}

export function ModuleCard({ module: mod, projectId }: ModuleCardProps) {
  const [, formAction] = useActionState(deleteModule, null);
  const ports = mod.ports as Array<{
    portId: string;
    name: string;
    direction: string;
    protocol?: string;
    voltage?: number;
  }> | null;

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5 hover:border-[#7C5CFC]/30 transition-colors group">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#7C5CFC]/10 flex items-center justify-center">
            <Cpu className="w-5 h-5 text-[#7C5CFC]" />
          </div>
          <div>
            <h3 className="font-medium text-neutral-100">{mod.name}</h3>
            <span className="text-xs text-neutral-500 capitalize">{mod.type}</span>
          </div>
        </div>
        <form action={formAction}>
          <input type="hidden" name="moduleId" value={mod.id} />
          <input type="hidden" name="projectId" value={projectId} />
          <DeleteButton />
        </form>
      </div>

      {mod.description && <p className="text-sm text-neutral-400 mt-2">{mod.description}</p>}

      {ports && ports.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {ports.map((p) => (
            <span
              key={p.portId}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-neutral-800 text-neutral-400"
            >
              {p.direction === "in" && <ArrowRight className="w-3 h-3 rotate-180" />}
              {p.direction === "out" && <ArrowRight className="w-3 h-3" />}
              {p.name}
              {p.voltage && <span className="text-neutral-600">{p.voltage}V</span>}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-4 text-xs text-neutral-600">
        <span className="capitalize">{mod.status}</span>
        <span>{mod.createdAt.toLocaleDateString()}</span>
      </div>
    </div>
  );
}
