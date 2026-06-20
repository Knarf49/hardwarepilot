import { Activity, Zap } from "lucide-react";
import Link from "next/link";
import { getProject } from "@/lib/services/project";
import { WaveformViewer } from "./waveform-viewer";

export const dynamic = "force-dynamic";

interface Signal {
  name: string;
  time: number[];
  voltage: number[];
  current: number[];
  power: number[];
}

interface SimResult {
  success: boolean;
  netlist: string;
  nodeVoltages?: number[];
  branchCurrents?: number[];
  signals?: Signal[];
  error?: string;
  warnings: string[];
  source?: string;
  componentCount?: number;
  netCount?: number;
}

async function runSimulation(projectId: string): Promise<SimResult> {
  const { default: mod } = await import("@/lib/chat-tools");
  const tools = mod.createTools(projectId);
  const result = await tools.generateNetlist.execute({ analysis: "dc" } as never);
  const netlist = (result as { netlist: string }).netlist;

  const rawResult = await tools.simulateCircuit.execute({});
  const simResult = rawResult as unknown as SimResult;

  const computeUrl = process.env.COMPUTE_SERVICE_URL;
  if (computeUrl) {
    try {
      const res = await fetch(`${computeUrl}/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          netlist,
          analysis_type: "dc",
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (res.ok) {
        const data = await res.json();
        return { ...simResult, signals: data.signals, source: "compute_service" };
      }
    } catch {
      // fall through to local result
    }
  }

  return simResult;
}

export default async function SimulationPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await getProject(projectId);
  if (!project) return null;

  const result = await runSimulation(projectId);

  let signals: Signal[] = result.signals ?? [];
  if (signals.length === 0 && result.nodeVoltages && result.nodeVoltages.length > 0) {
    const voltages = result.nodeVoltages;
    signals = [
      {
        name: "Node Voltages (DC)",
        time: voltages.map((_, i) => i),
        voltage: voltages,
        current: result.branchCurrents ?? [],
        power: [],
      },
    ];
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        href={`/projects/${projectId}`}
        className="text-neutral-500 text-sm hover:text-neutral-300 transition-colors"
      >
        Back to project
      </Link>

      <div className="mt-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          Simulation — {project.name}
        </h1>
        <p className="text-neutral-400 mt-1 text-sm">
          DC operating point analysis
        </p>
      </div>

      <div className="mt-6 space-y-6">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-[#7C5CFC]" />
            <h2 className="font-medium text-neutral-100">Results</h2>
            {result.source && (
              <span className="text-xs text-neutral-600 ml-auto">
                solver: {result.source}
              </span>
            )}
          </div>

          {!result.success && result.error ? (
            <div className="p-4 rounded-lg border border-red-900/50 bg-red-950/30">
              <p className="text-red-400 text-sm font-medium">Simulation failed</p>
              <p className="text-red-300/70 text-sm mt-1">{result.error}</p>
            </div>
          ) : signals.length > 0 ? (
            <div className="space-y-4">
              {signals.map((signal, idx) => (
                <WaveformViewer key={idx} signal={signal} />
              ))}
            </div>
          ) : (
            <p className="text-neutral-500 text-sm">
              No signals to display. Add components with nets to run simulation.
            </p>
          )}
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-[#7C5CFC]" />
            <h2 className="font-medium text-neutral-100">SPICE Netlist</h2>
          </div>
          <pre className="text-xs text-neutral-400 font-mono bg-neutral-950 rounded-lg p-4 overflow-auto max-h-96">
            {result.netlist || "* No netlist generated"}
          </pre>
          {result.warnings && result.warnings.length > 0 && (
            <div className="mt-3 space-y-1">
              {result.warnings.map((w, i) => (
                <p key={i} className="text-xs text-amber-400 font-mono">
                  * WARNING: {w}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
