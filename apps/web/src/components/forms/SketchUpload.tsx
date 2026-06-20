"use client";

import { Upload } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface SketchUploadProps {
  projectId: string;
}

export function SketchUpload({ projectId: _projectId }: SketchUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-neutral-800 rounded-xl p-8 text-center hover:border-neutral-700 transition-colors">
        {preview ? (
          <div className="space-y-3">
            <Image
              src={preview}
              alt="Sketch preview"
              width={400}
              height={300}
              className="max-h-64 mx-auto rounded object-contain"
            />
            <p className="text-sm text-neutral-500">
              Sketch uploaded. AI processing not yet available.
            </p>
          </div>
        ) : (
          <label className="cursor-pointer flex flex-col items-center gap-3">
            <Upload className="w-8 h-8 text-neutral-500" />
            <span className="text-neutral-400">Upload a sketch or photo</span>
            <span className="text-xs text-neutral-600">
              PNG, JPG, or WebP — AI will trace outline
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        )}
      </div>
      <p className="text-sm text-neutral-600">
        AI-powered sketch-to-outline coming in a future update.
      </p>
    </div>
  );
}
