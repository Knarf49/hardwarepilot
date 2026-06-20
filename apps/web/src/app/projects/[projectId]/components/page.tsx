import { notFound } from "next/navigation";
import { ComponentSchematic } from "@/components/circuit/ComponentSchematic";
import { getComponents } from "@/lib/services/circuit";
import { getModules } from "@/lib/services/module";
import { getProject } from "@/lib/services/project";

export const dynamic = "force-dynamic";

export default async function ComponentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ moduleId?: string }>;
}) {
  const { projectId } = await params;
  const { moduleId } = await searchParams;
  const [project, modules] = await Promise.all([getProject(projectId), getModules(projectId)]);

  if (!project) notFound();

  const selectedModuleId = moduleId ?? modules[0]?.id;
  const components = selectedModuleId ? await getComponents(selectedModuleId) : [];

  return (
    <div className="max-w-5xl mx-auto">
      <a
        href={`/projects/${projectId}`}
        className="text-neutral-500 text-sm hover:text-neutral-300 transition-colors"
      >
        Back to project
      </a>
      <h1 className="text-2xl font-semibold tracking-tight mt-2">{project.name} — Components</h1>
      <p className="text-neutral-400 mt-1">Define components inside each module</p>

      <div className="mt-6">
        <ComponentSchematic
          projectId={projectId}
          modules={modules}
          selectedModuleId={selectedModuleId ?? null}
          components={components}
        />
      </div>
    </div>
  );
}
