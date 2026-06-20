"use client";

import {
  Background,
  Controls,
  type Edge,
  MiniMap,
  type Node,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { ModuleModel } from "@hardwarepilot/db";

interface ModuleGraphCanvasProps {
  modules: ModuleModel[];
}

function buildNodesAndEdges(modules: ModuleModel[]): {
  nodes: Node[];
  edges: Edge[];
} {
  const nodes: Node[] = modules.map((m, i) => {
    const pos = m.position as { x: number; y: number; z: number } | null;
    return {
      id: m.id,
      type: "default",
      position: pos ? { x: pos.x, y: pos.y } : { x: i * 200 + 80, y: 200 },
      data: {
        label: (
          <div className="px-3 py-2 min-w-[120px]">
            <div className="font-medium text-neutral-100 text-sm">{m.name}</div>
            <div className="text-xs text-neutral-500 capitalize">{m.type}</div>
          </div>
        ),
      },
      style: {
        background: "#171717",
        border: "1px solid #262626",
        borderRadius: "12px",
        fontSize: 12,
      },
    };
  });

  return { nodes, edges: [] };
}

export function ModuleGraphCanvas({ modules }: ModuleGraphCanvasProps) {
  const { nodes: initialNodes, edges: initialEdges } = buildNodesAndEdges(modules);
  const [nodes, _setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, _setEdges, onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className="w-full h-[500px] rounded-xl border border-neutral-800 overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        attributionPosition="bottom-left"
        className="bg-neutral-950"
      >
        <Background color="#262626" gap={20} />
        <Controls className="bg-neutral-900 border-neutral-800 fill-neutral-400" />
        <MiniMap
          nodeColor="#7C5CFC"
          maskColor="rgba(0,0,0,0.7)"
          className="bg-neutral-900 border-neutral-800"
        />
      </ReactFlow>
    </div>
  );
}
