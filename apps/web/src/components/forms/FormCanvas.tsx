"use client";

import { useCallback, useRef, useState } from "react";

interface Vertex {
  x: number;
  y: number;
}

interface FormCanvasProps {
  initialVertices?: Vertex[];
  onSave: (vertices: Vertex[], dimension: { w: number; h: number; d: number }) => void;
  saving?: boolean;
}

const CANVAS_SIZE = 600;
const CLOSE_RADIUS = 12;
const GRID_STEP = 40;

const gridLinesV = Array.from({ length: CANVAS_SIZE / GRID_STEP + 1 }, (_, i) => i);
const gridLinesH = Array.from({ length: CANVAS_SIZE / GRID_STEP + 1 }, (_, i) => i);

export function FormCanvas({ initialVertices, onSave, saving }: FormCanvasProps) {
  const [vertices, setVertices] = useState<Vertex[]>(initialVertices ?? []);
  const [closed, setClosed] = useState(initialVertices ? initialVertices.length >= 3 : false);
  const [dragging, setDragging] = useState<number | null>(null);
  const [dimension, setDimension] = useState({ w: 100, h: 60, d: 5 });
  const svgRef = useRef<SVGSVGElement>(null);

  const getSvgCoords = useCallback((e: React.MouseEvent<SVGSVGElement>): Vertex | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const scaleX = CANVAS_SIZE / rect.width;
    const scaleY = CANVAS_SIZE / rect.height;
    return {
      x: Math.round((e.clientX - rect.left) * scaleX),
      y: Math.round((e.clientY - rect.top) * scaleY),
    };
  }, []);

  const isNearVertex = useCallback(
    (p: Vertex, index: number) => {
      const v = vertices[index];
      return Math.hypot(p.x - v.x, p.y - v.y) < CLOSE_RADIUS;
    },
    [vertices],
  );

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (closed || dragging !== null) return;
      const p = getSvgCoords(e);
      if (!p) return;

      if (vertices.length >= 3 && isNearVertex(p, 0)) {
        setClosed(true);
        return;
      }

      setVertices((prev) => [...prev, p]);
    },
    [closed, dragging, getSvgCoords, isNearVertex, vertices.length],
  );

  const handleMouseDown = useCallback((e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setDragging(index);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (dragging === null) return;
      const p = getSvgCoords(e);
      if (!p) return;
      setVertices((prev) => {
        const next = [...prev];
        next[dragging] = p;
        return next;
      });
    },
    [dragging, getSvgCoords],
  );

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (vertices.length >= 3 && !closed) {
          setClosed(true);
        }
      }
      if (e.key === "r" || e.key === "R") {
        setVertices([]);
        setClosed(false);
      }
    },
    [vertices.length, closed],
  );

  const handleSave = useCallback(() => {
    if (vertices.length < 3) return;
    onSave(vertices, dimension);
  }, [vertices, dimension, onSave]);

  const handleReset = useCallback(() => {
    setVertices([]);
    setClosed(false);
  }, []);

  const pointsString = vertices.map((v) => `${v.x},${v.y}`).join(" ");
  const closeHint = vertices.length >= 3 && !closed;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label htmlFor="form-width" className="text-sm text-neutral-400">
            W (mm)
          </label>
          <input
            id="form-width"
            type="number"
            value={dimension.w}
            onChange={(e) => setDimension((d) => ({ ...d, w: Number(e.target.value) }))}
            className="w-20 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-sm text-neutral-100"
            min={1}
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="form-height" className="text-sm text-neutral-400">
            H (mm)
          </label>
          <input
            id="form-height"
            type="number"
            value={dimension.h}
            onChange={(e) => setDimension((d) => ({ ...d, h: Number(e.target.value) }))}
            className="w-20 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-sm text-neutral-100"
            min={1}
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="form-depth" className="text-sm text-neutral-400">
            D (mm)
          </label>
          <input
            id="form-depth"
            type="number"
            value={dimension.d}
            onChange={(e) => setDimension((d) => ({ ...d, d: Number(e.target.value) }))}
            className="w-20 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-sm text-neutral-100"
            min={1}
          />
        </div>

        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-1.5 text-sm bg-neutral-800 border border-neutral-700 rounded hover:bg-neutral-700 text-neutral-300 transition-colors"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={vertices.length < 3 || saving}
            className="px-3 py-1.5 text-sm bg-[#7C5CFC] hover:bg-[#6B4FE0] disabled:opacity-50 disabled:cursor-not-allowed rounded text-white font-medium transition-colors"
          >
            {saving ? "Saving..." : "Save Form"}
          </button>
        </div>
      </div>

      <div className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-900/50">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}
          className="w-full h-auto cursor-crosshair"
          role="img"
          aria-label="Form shape drawing canvas. Click to add vertices. Press Enter to close the shape."
          onKeyDown={handleKeyDown}
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <title>Form Shape Editor</title>
          {gridLinesV.map((i) => (
            <line
              key={`vg-${i}`}
              x1={i * GRID_STEP}
              y1={0}
              x2={i * GRID_STEP}
              y2={CANVAS_SIZE}
              stroke="#1f1f1f"
              strokeWidth={1}
            />
          ))}
          {gridLinesH.map((i) => (
            <line
              key={`hg-${i}`}
              x1={0}
              y1={i * GRID_STEP}
              x2={CANVAS_SIZE}
              y2={i * GRID_STEP}
              stroke="#1f1f1f"
              strokeWidth={1}
            />
          ))}

          {vertices.length >= 2 && (
            <polyline
              points={pointsString}
              fill="none"
              stroke="#7C5CFC"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {closed && vertices.length >= 3 && (
            <polygon
              points={pointsString}
              fill="rgba(124, 92, 252, 0.08)"
              stroke="#7C5CFC"
              strokeWidth={2}
              strokeLinejoin="round"
            />
          )}

          {vertices.map((v, i) => {
            const key = `${v.x}-${v.y}-${i}`;
            return (
              <g key={key}>
                <circle
                  cx={v.x}
                  cy={v.y}
                  r={i === 0 && closeHint ? 7 : 5}
                  fill={i === 0 && closeHint ? "#7C5CFC" : "#a78bfa"}
                  stroke={i === 0 ? "#7C5CFC" : "#a78bfa"}
                  strokeWidth={2}
                  className="cursor-pointer hover:fill-[#7C5CFC] transition-colors"
                  aria-label={`Vertex ${i + 1} at ${v.x}, ${v.y}`}
                  onMouseDown={(e) => handleMouseDown(e, i)}
                />
                {i === 0 && closeHint && (
                  <circle
                    cx={v.x}
                    cy={v.y}
                    r={CLOSE_RADIUS}
                    fill="none"
                    stroke="#7C5CFC"
                    strokeWidth={1}
                    strokeDasharray="4 2"
                    className="pointer-events-none"
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <p className="text-sm text-neutral-500">
        {vertices.length === 0
          ? "Click on the canvas to add vertices. Add at least 3 points to define a shape."
          : vertices.length < 3
            ? `${vertices.length} point${vertices.length > 1 ? "s" : ""} — add ${3 - vertices.length} more to close the shape.`
            : closed
              ? `Shape closed — ${vertices.length} vertices. Drag points to adjust.`
              : `Click near the first point (purple) to close the shape.`}
      </p>
    </div>
  );
}
