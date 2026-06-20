"use client";

import type { ModuleModel } from "@hardwarepilot/db";
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { createComponent, deleteComponent } from "@/actions/circuit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ComponentData {
  id: string;
  name: string;
  type: string;
  value: string | null;
  footprint: string | null;
  pins: unknown;
  createdAt: Date;
}

const COMPONENT_TYPES = [
  "resistor",
  "capacitor",
  "inductor",
  "diode",
  "transistor",
  "ic",
  "connector",
  "voltage_source",
  "current_source",
  "custom",
];

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="bg-[#7C5CFC] hover:bg-[#6B4FE0] gap-2">
      <Plus className="w-4 h-4" />
      {pending ? "Adding..." : label}
    </Button>
  );
}

function DeleteButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="ghost"
      size="icon"
      disabled={pending}
      className="text-neutral-600 hover:text-red-400"
    >
      <Trash2 className="w-4 h-4" />
    </Button>
  );
}

export function ComponentSchematic({
  projectId,
  modules,
  selectedModuleId,
  components,
}: {
  projectId: string;
  modules: ModuleModel[];
  selectedModuleId: string | null;
  components: ComponentData[];
}) {
  const router = useRouter();
  const [pinsText, setPinsText] = useState("");
  const [, createAction] = useActionState(createComponent, null);
  const [, deleteAction] = useActionState(deleteComponent, null);

  return (
    <div className="space-y-6">
      {modules.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-neutral-800 rounded-xl">
          <p className="text-neutral-500">No modules yet. Add modules first.</p>
        </div>
      ) : (
        <>
          <div className="flex gap-2 flex-wrap">
            {modules.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => router.push(`/projects/${projectId}/components?moduleId=${m.id}`)}
                className={`px-3 py-1.5 text-sm rounded border transition-colors ${
                  selectedModuleId === m.id
                    ? "border-[#7C5CFC] bg-[#7C5CFC]/10 text-[#7C5CFC]"
                    : "border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-neutral-200"
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>

          {selectedModuleId && (
            <>
              <form
                action={createAction}
                onSubmit={() => setPinsText("")}
                className="space-y-3 p-4 rounded-xl border border-neutral-800 bg-neutral-900"
              >
                <h3 className="text-sm font-medium text-neutral-300">Add Component</h3>
                <input type="hidden" name="projectId" value={projectId} />
                <input type="hidden" name="moduleId" value={selectedModuleId} />
                <input type="hidden" name="pins" value={pinsText || "[]"} />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="comp-name">Name</Label>
                    <Input
                      id="comp-name"
                      name="name"
                      placeholder="R1"
                      required
                      className="bg-neutral-800 border-neutral-700"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="comp-type">Type</Label>
                    <select
                      id="comp-type"
                      name="type"
                      required
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-sm text-neutral-100"
                    >
                      {COMPONENT_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="comp-value">Value</Label>
                    <Input
                      id="comp-value"
                      name="value"
                      placeholder="10k"
                      className="bg-neutral-800 border-neutral-700"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="comp-footprint">Footprint</Label>
                    <Input
                      id="comp-footprint"
                      name="footprint"
                      placeholder="0805"
                      className="bg-neutral-800 border-neutral-700"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="comp-pins">Pins (JSON)</Label>
                  <textarea
                    id="comp-pins"
                    value={pinsText}
                    onChange={(e) => setPinsText(e.target.value)}
                    placeholder='[{"pinId":"p1","name":"VCC"},{"pinId":"p2","name":"GND"}]'
                    rows={2}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-xs font-mono text-neutral-100 placeholder:text-neutral-600"
                  />
                </div>
                <SubmitButton label="Add Component" />
              </form>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wider">
                  Components ({components.length})
                </h3>
                {components.length === 0 ? (
                  <p className="text-neutral-600 text-sm">No components in this module yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {components.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-neutral-800 bg-neutral-900 group hover:border-neutral-700"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm text-neutral-100">{c.name}</span>
                            <span className="text-xs text-neutral-500 capitalize">{c.type}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-neutral-600">
                            {c.value && <span>{c.value}</span>}
                            {c.footprint && <span>{c.footprint}</span>}
                          </div>
                        </div>
                        <form
                          action={deleteAction}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <input type="hidden" name="componentId" value={c.id} />
                          <input type="hidden" name="projectId" value={projectId} />
                          <DeleteButton />
                        </form>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
