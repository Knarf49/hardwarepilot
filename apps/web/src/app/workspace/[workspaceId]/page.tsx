import { notFound } from "next/navigation";
import { CreateProjectDialog } from "@/components/projects/CreateProjectDialog";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { getProjects } from "@/lib/services/project";
import { getWorkspace } from "@/lib/services/workspace";

export const dynamic = "force-dynamic";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const [workspace, projects] = await Promise.all([
    getWorkspace(workspaceId),
    getProjects(workspaceId),
  ]);

  if (!workspace) notFound();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <a href="/" className="text-neutral-500 text-sm hover:text-neutral-300 transition-colors">
            Workspaces
          </a>
          <h1 className="text-2xl font-semibold tracking-tight mt-1">{workspace.name}</h1>
          <p className="text-neutral-400 mt-1">Projects in this workspace</p>
        </div>
        <CreateProjectDialog workspaceId={workspaceId} />
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-neutral-800 rounded-xl">
          <p className="text-neutral-500 text-lg">No projects yet</p>
          <p className="text-neutral-600 mt-1">Create your first hardware project</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}
