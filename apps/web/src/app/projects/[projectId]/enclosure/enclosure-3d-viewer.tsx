"use client";

import { Enclosure3D } from "@/components/enclosure/Enclosure3D";

interface Module3D {
  id: string;
  name: string;
  position: { x: number; y: number; z: number; rotation: number };
  dimension: { w: number; h: number; d: number };
}

interface Vertex {
  x: number;
  y: number;
}

interface MeshData {
  vertices: number[][];
  triangles: number[][];
}

export function Enclosure3DViewer({
  modules,
  formVertices,
  enclosureMesh,
  height,
  wallThickness,
}: {
  modules: Module3D[];
  formVertices: Vertex[];
  enclosureMesh: MeshData | null;
  height: number;
  wallThickness: number;
}) {
  if (formVertices.length < 3) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-neutral-500 text-sm">
          Define a form shape to preview the enclosure
        </p>
      </div>
    );
  }

  return (
    <Enclosure3D
      modules={modules}
      formVertices={formVertices}
      enclosureMesh={enclosureMesh}
      height={height}
      wallThickness={wallThickness}
    />
  );
}
