import { db } from "@hardwarepilot/db";
import { notFound } from "next/navigation";
import { CreateModuleDialog } from "@/components/modules/CreateModuleDialog";
import { ModuleCard } from "@/components/modules/ModuleCard";
import { ModuleGraphCanvas } from "@/components/modules/ModuleGraphCanvas";
import { getModules } from "@/lib/services/module";
import { getProject } from "@/lib/services/project";

export const dynamic = "force-dynamic";

export default async function ModulesPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const [project, modules, connections] = await Promise.all([
    getProject(projectId),
    getModules(projectId),
    db.moduleConnection.findMany({ where: { projectId } }),
  ]);

  if (!project) notFound();

  return (
    <div className="max-w-5xl mx-auto">
      <a
        href={`/projects/${projectId}`}
        className="text-neutral-500 text-sm hover:text-neutral-300 transition-colors"
      >
        Back to project
      </a>
      <div className="flex items-center justify-between mt-2 mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{project.name} — Modules</h1>
          <p className="text-neutral-400 mt-1">
            Define functional electronics modules for your design
          </p>
        </div>
        <CreateModuleDialog projectId={projectId} />
      </div>

      {modules.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wider mb-3">
            Module Graph
          </h2>
          <ModuleGraphCanvas modules={modules} connections={connections} projectId={projectId} />
        </div>
      )}

      <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wider mb-3">
        Module List
      </h2>

      {modules.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-neutral-800 rounded-xl">
          <p className="text-neutral-500 text-lg">No modules yet</p>
          <p className="text-neutral-600 mt-1">
            Add functional modules like Power, MCU, Sensor, or Display
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modules.map((mod) => (
            <ModuleCard key={mod.id} module={mod} projectId={projectId} />
          ))}
        </div>
      )}
    </div>
  );
}
