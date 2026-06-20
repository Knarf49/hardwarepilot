import { Box, Download, Layers } from "lucide-react";
import Link from "next/link";
import { getForm } from "@/lib/services/form";
import { getModules } from "@/lib/services/module";
import { getProject } from "@/lib/services/project";
import { Enclosure3DViewer } from "./enclosure-3d-viewer";

export const dynamic = "force-dynamic";

interface Vertex {
  x: number;
  y: number;
}

interface MeshData {
  vertices: number[][];
  triangles: number[][];
}

async function generateEnclosure(
  projectId: string,
  vertices: Vertex[],
): Promise<{ mesh: MeshData | null; stlBase64: string | null; error: string | null }> {
  if (vertices.length < 3) {
    return { mesh: null, stlBase64: null, error: "Need at least 3 form vertices" };
  }

  const computeUrl = process.env.COMPUTE_SERVICE_URL;
  if (computeUrl) {
    try {
      const res = await fetch(`${computeUrl}/enclosure/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          vertices,
          height: 30,
          wall_thickness: 2,
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (res.ok) {
        const data = await res.json();
        return {
          mesh: data.mesh ?? null,
          stlBase64: data.stl_base64 ?? null,
          error: data.error ?? null,
        };
      }
    } catch {
      // fall through to local generation
    }
  }

  const cx = vertices.reduce((s, v) => s + v.x, 0) / vertices.length;
  const cy = vertices.reduce((s, v) => s + v.y, 0) / vertices.length;
  const sorted = [...vertices].sort(
    (a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx),
  );

  const bottomVerts: number[][] = [];
  const topVerts: number[][] = [];
  for (const v of sorted) {
    bottomVerts.push([v.x, v.y, 0]);
    topVerts.push([v.x, v.y, 30]);
  }

  const allVerts: number[][] = [];
  const allTris: number[][] = [];
  const n = sorted.length;

  for (let i = 0; i < n; i++) {
    allVerts.push(bottomVerts[i]);
    allVerts.push(topVerts[i]);
  }

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const bi = i * 2;
    const bj = j * 2;
    const ti = bi + 1;
    const tj = bj + 1;
    allTris.push([bi, bj, ti]);
    allTris.push([bj, tj, ti]);
  }

  return {
    mesh: { vertices: allVerts, triangles: allTris },
    stlBase64: null,
    error: null,
  };
}

export default async function EnclosurePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const [project, form, modules] = await Promise.all([
    getProject(projectId),
    getForm(projectId),
    getModules(projectId),
  ]);

  if (!project) return null;

  const vertices: Vertex[] = form
    ? ((form.polygon as { points: Vertex[] })?.points ?? [])
    : [];
  const { mesh, stlBase64, error } = await generateEnclosure(projectId, vertices);

  const moduleData = modules.map((m) => {
    const pos = (m.position as { x: number; y: number; z: number; rotation: number } | null) ?? {
      x: 0, y: 0, z: 0, rotation: 0,
    };
    const dim = (m.dimension as { w: number; h: number; d: number } | null) ?? {
      w: 20, h: 20, d: 5,
    };
    return {
      id: m.id,
      name: m.name,
      position: pos,
      dimension: dim,
    };
  });

  return (
    <div className="max-w-6xl mx-auto">
      <Link
        href={`/projects/${projectId}`}
        className="text-neutral-500 text-sm hover:text-neutral-300 transition-colors"
      >
        Back to project
      </Link>

      <div className="mt-4">
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Box className="w-6 h-6 text-[#7C5CFC]" />
          Enclosure — {project.name}
        </h1>
        <p className="text-neutral-400 mt-1 text-sm">
          3D preview of enclosure walls and module placement
        </p>
      </div>

      {error && (
        <div className="mt-4 p-4 rounded-lg border border-amber-900/50 bg-amber-950/30">
          <p className="text-amber-400 text-sm">{error}</p>
          <p className="text-amber-300/70 text-xs mt-1">
            Define a form shape with at least 3 vertices to generate an enclosure.
          </p>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden h-[500px]">
          <Enclosure3DViewer
            modules={moduleData}
            formVertices={vertices}
            enclosureMesh={mesh}
            height={30}
            wallThickness={2}
          />
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4 text-[#7C5CFC]" />
              <h2 className="text-sm font-medium text-neutral-200">Stats</h2>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-neutral-500">Form vertices</dt>
                <dd className="text-neutral-300 font-mono">{vertices.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-500">Modules placed</dt>
                <dd className="text-neutral-300 font-mono">{modules.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-500">Enclosure height</dt>
                <dd className="text-neutral-300 font-mono">30 mm</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-500">Wall thickness</dt>
                <dd className="text-neutral-300 font-mono">2 mm</dd>
              </div>
              {mesh && (
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Mesh triangles</dt>
                  <dd className="text-neutral-300 font-mono">{mesh.triangles.length}</dd>
                </div>
              )}
            </dl>
          </div>

          {stlBase64 && (
            <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
              <a
                href={`data:application/octet-stream;base64,${stlBase64}`}
                download={`${project.name.replace(/\s+/g, "_")}_enclosure.stl`}
                className="flex items-center gap-2 text-sm text-[#7C5CFC] hover:text-[#9B8CFC] transition-colors"
              >
                <Download className="w-4 h-4" />
                Download STL
              </a>
              <p className="text-xs text-neutral-500 mt-1">
                Binary STL, ready for slicing software
              </p>
            </div>
          )}

          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
            <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2">
              Modules
            </h3>
            <ul className="space-y-1">
              {modules.map((m) => (
                <li key={m.id} className="text-sm text-neutral-300 flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: "#22C55E" }}
                  />
                  {m.name}
                </li>
              ))}
              {modules.length === 0 && (
                <li className="text-sm text-neutral-600">No modules defined</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
