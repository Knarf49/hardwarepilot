"use client";

import { MessageSquare, PenTool, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { createForm, updateForm } from "@/actions/form";
import { FormCanvas } from "./FormCanvas";
import { ShapeDescription } from "./ShapeDescription";
import { SketchUpload } from "./SketchUpload";

interface Vertex {
  x: number;
  y: number;
}

interface ExistingForm {
  id: string;
  vertices: Vertex[];
  dimension: { w: number; h: number; d: number };
}

interface FormWorkspaceProps {
  projectId: string;
  existingForm: ExistingForm | null;
}

type Tab = "draw" | "upload" | "describe";

export function FormWorkspace({ projectId, existingForm }: FormWorkspaceProps) {
  const [tab, setTab] = useState<Tab>("draw");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const handleSave = useCallback(
    async (vertices: Vertex[], dimension: { w: number; h: number; d: number }) => {
      setSaving(true);
      const formData = new FormData();
      formData.set("projectId", projectId);

      if (existingForm) {
        formData.set("formId", existingForm.id);
        formData.set("polygon", JSON.stringify({ vertices }));
        formData.set("dimension", JSON.stringify(dimension));
        await updateForm(null, formData);
      } else {
        formData.set("vertices", JSON.stringify(vertices));
        formData.set("dimension", JSON.stringify(dimension));
        await createForm(null, formData);
      }

      setSaving(false);
      router.refresh();
    },
    [projectId, existingForm, router],
  );

  const tabs = [
    { id: "draw" as const, label: "Draw Outline", icon: PenTool },
    { id: "upload" as const, label: "Upload Sketch", icon: Upload },
    { id: "describe" as const, label: "Describe Shape", icon: MessageSquare },
  ];

  return (
    <div className="space-y-6">
      <div className="flex border-b border-neutral-800">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === id
                ? "border-[#7C5CFC] text-[#7C5CFC]"
                : "border-transparent text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === "draw" && (
        <FormCanvas initialVertices={existingForm?.vertices} onSave={handleSave} saving={saving} />
      )}
      {tab === "upload" && <SketchUpload projectId={projectId} />}
      {tab === "describe" && <ShapeDescription projectId={projectId} />}
    </div>
  );
}
