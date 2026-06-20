"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { createProject } from "@/actions/project";
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

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="bg-[#7C5CFC] hover:bg-[#6B4FE0]">
      {pending ? "Creating..." : "Create Project"}
    </Button>
  );
}

export function CreateProjectDialog({ workspaceId }: { workspaceId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="bg-[#7C5CFC] hover:bg-[#6B4FE0] gap-2">
        <Plus className="w-4 h-4" />
        New Project
      </DialogTrigger>
      <DialogContent className="bg-neutral-900 border-neutral-800 text-neutral-100">
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
        </DialogHeader>
        <form action={createProject} onSubmit={() => setOpen(false)} className="space-y-4 mt-2">
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="Heart-shaped ESP32 Gift"
              required
              minLength={1}
              maxLength={200}
              className="bg-neutral-800 border-neutral-700"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              name="description"
              placeholder="A wearable heart-shaped device with ESP32"
              maxLength={1000}
              className="bg-neutral-800 border-neutral-700"
            />
          </div>
          <SubmitButton />
        </form>
      </DialogContent>
    </Dialog>
  );
}
