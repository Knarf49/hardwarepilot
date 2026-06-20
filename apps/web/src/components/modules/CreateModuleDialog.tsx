"use client";

import { Plus } from "lucide-react";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { createModule } from "@/actions/module";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MODULE_TYPES = [
  { value: "power", label: "Power" },
  { value: "mcu", label: "MCU" },
  { value: "sensor", label: "Sensor" },
  { value: "display", label: "Display" },
  { value: "battery", label: "Battery" },
  { value: "connectivity", label: "Connectivity" },
  { value: "storage", label: "Storage" },
  { value: "actuator", label: "Actuator" },
  { value: "custom", label: "Custom" },
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="bg-[#7C5CFC] hover:bg-[#6B4FE0]">
      {pending ? "Creating..." : "Add Module"}
    </Button>
  );
}

export function CreateModuleDialog({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [portsText, setPortsText] = useState("");
  const [, formAction] = useActionState(createModule, null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#7C5CFC] hover:bg-[#6B4FE0] gap-2">
          <Plus className="w-4 h-4" />
          Add Module
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-neutral-900 border-neutral-800 text-neutral-100 max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Module</DialogTitle>
        </DialogHeader>
        <form action={formAction} onSubmit={() => setOpen(false)} className="space-y-4 mt-2">
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="dimension" value='{"w":30,"h":20,"d":5}' />

          <div className="space-y-2">
            <Label htmlFor="mod-name">Name</Label>
            <Input
              id="mod-name"
              name="name"
              placeholder="Power Module"
              required
              className="bg-neutral-800 border-neutral-700"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mod-type">Type</Label>
            <select
              id="mod-type"
              name="type"
              required
              className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-sm text-neutral-100"
            >
              {MODULE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mod-desc">Description (optional)</Label>
            <Input
              id="mod-desc"
              name="description"
              placeholder="Regulates 5V to 3.3V"
              className="bg-neutral-800 border-neutral-700"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mod-ports">
              Ports (JSON — portId, name, direction, protocol?, voltage?)
            </Label>
            <textarea
              id="mod-ports"
              name="ports"
              value={portsText}
              onChange={(e) => setPortsText(e.target.value)}
              placeholder='[{"portId":"p1","name":"3.3V","direction":"out","protocol":"power","voltage":3.3}]'
              rows={4}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-xs font-mono text-neutral-100 placeholder:text-neutral-600 resize-y"
            />
          </div>

          <SubmitButton />
        </form>
      </DialogContent>
    </Dialog>
  );
}
