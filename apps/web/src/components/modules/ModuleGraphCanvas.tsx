"use client";

import {
  addEdge,
  Background,
  Controls,
  type Edge,
  MiniMap,
  type Node,
  type NodeProps,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import { useCallback, useEffect, useRef, useState } from "react";
import "@xyflow/react/dist/style.css";
import type { ModuleModel } from "@hardwarepilot/db";
import { Trash2 } from "lucide-react";
import { deleteModule, saveModulePosition } from "@/actions/module";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface ModuleConnection {
  id: string;
  sourceModuleId: string;
  targetModuleId: string;
  sourcePortId: string;
  targetPortId: string;
  type: string;
}

interface ModuleGraphCanvasProps {
  modules: ModuleModel[];
  connections: ModuleConnection[];
  projectId: string;
}

function ModuleNode({ data }: NodeProps) {
  return (
    <div className="px-3 py-2 min-w-[120px] cursor-pointer">
      <div className="font-medium text-neutral-100 text-sm">{data.name as string}</div>
      <div className="text-xs text-neutral-500 capitalize">{data.type as string}</div>
    </div>
  );
}

const nodeTypes = { moduleNode: ModuleNode };

function buildNodesAndEdges(
  modules: ModuleModel[],
  connections: ModuleConnection[],
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = modules.map((m, i) => {
    const pos = m.position as { x: number; y: number; z: number } | null;
    return {
      id: m.id,
      type: "moduleNode",
      position: pos ? { x: pos.x, y: pos.y } : { x: i * 200 + 80, y: 200 },
      data: { name: m.name, type: m.type },
      style: {
        background: "#171717",
        border: "1px solid #262626",
        borderRadius: "12px",
        fontSize: 12,
      },
    };
  });

  const edges: Edge[] = connections.map((c) => ({
    id: c.id,
    source: c.sourceModuleId,
    target: c.targetModuleId,
    label: `${c.sourcePortId} → ${c.targetPortId}`,
    labelStyle: { fill: "#737373", fontSize: 10 },
    style: { stroke: "#7C5CFC", strokeWidth: 1.5 },
    animated: c.type === "electrical",
  }));

  return { nodes, edges };
}

export function ModuleGraphCanvas({ modules, connections, projectId }: ModuleGraphCanvasProps) {
  const { nodes: initialNodes, edges: initialEdges } = buildNodesAndEdges(modules, connections);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [contextNode, setContextNode] = useState<Node | null>(null);
  const [contextOpen, setContextOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = buildNodesAndEdges(modules, connections);
    setNodes(newNodes);
    setEdges(newEdges);
  }, [modules, connections, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Parameters<typeof addEdge>[0]) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const onNodeDragStop = useCallback(
    (_event: unknown, node: Node) => {
      const formData = new FormData();
      formData.set("moduleId", node.id);
      formData.set("projectId", projectId);
      formData.set("position", JSON.stringify({ x: node.position.x, y: node.position.y }));
      saveModulePosition(formData);
    },
    [projectId],
  );

  const onNodesDelete = useCallback(
    (deletedNodes: Node[]) => {
      for (const node of deletedNodes) {
        const formData = new FormData();
        formData.set("moduleId", node.id);
        formData.set("projectId", projectId);
        deleteModule(null, formData);
      }
    },
    [projectId],
  );

  const onNodeContextMenu = useCallback((event: React.MouseEvent | MouseEvent, node: Node) => {
    event.preventDefault();
    setContextNode(node);
    setContextOpen(true);
  }, []);

  const onPaneContextMenu = useCallback((event: React.MouseEvent | MouseEvent) => {
    event.preventDefault();
    setContextNode(null);
    setContextOpen(false);
  }, []);

  const handleDeleteContext = useCallback(() => {
    if (!contextNode) return;
    const formData = new FormData();
    formData.set("moduleId", contextNode.id);
    formData.set("projectId", projectId);
    deleteModule(null, formData);
    setContextOpen(false);
    setContextNode(null);
  }, [contextNode, projectId]);

  return (
    <div
      ref={containerRef}
      className="w-full h-[500px] rounded-xl border border-neutral-800 overflow-hidden [&_.react-flow__pane]:cursor-auto"
    >
      <ContextMenu open={contextOpen} onOpenChange={setContextOpen}>
        <ContextMenuTrigger className="w-full h-full p-0 border-0">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeDragStop={onNodeDragStop}
            onNodesDelete={onNodesDelete}
            onNodeContextMenu={onNodeContextMenu}
            onPaneContextMenu={onPaneContextMenu}
            deleteKeyCode={["Delete", "Backspace"]}
            selectionOnDrag
            panActivationKeyCode="Space"
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
        </ContextMenuTrigger>
        <ContextMenuContent className="bg-neutral-900 border-neutral-800">
          {contextNode && (
            <ContextMenuGroup>
              <ContextMenuLabel className="text-neutral-400">
                {(contextNode.data.name as string) ?? ""}
              </ContextMenuLabel>
              <ContextMenuSeparator className="bg-neutral-800" />
              <ContextMenuItem
                onClick={handleDeleteContext}
                className="text-red-400 focus:bg-red-400/10 focus:text-red-400 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 mr-2" />
                Delete Module
              </ContextMenuItem>
            </ContextMenuGroup>
          )}
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
}
