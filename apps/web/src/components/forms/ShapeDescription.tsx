"use client";

import { MessageSquare } from "lucide-react";
import { useState } from "react";

interface ShapeDescriptionProps {
  projectId: string;
}

export function ShapeDescription({ projectId: _projectId }: ShapeDescriptionProps) {
  const [description, setDescription] = useState("");

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder='Describe the product shape, for example: "A heart-shaped wearable device that fits in the palm of your hand, about 50mm wide and 30mm tall..."'
          rows={4}
          className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-sm text-neutral-100 placeholder:text-neutral-600 resize-y"
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={!description.trim()}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-[#7C5CFC] hover:bg-[#6B4FE0] disabled:opacity-50 disabled:cursor-not-allowed rounded text-white font-medium transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          Generate Outline with AI
        </button>
      </div>
      <p className="text-sm text-neutral-600">
        The Intent Agent will process this description in the next step to suggest a form outline
        and functional modules.
      </p>
    </div>
  );
}
