import { notFound } from "next/navigation";
import { getProject } from "@/lib/services/project";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await getProject(projectId);

  if (!project) notFound();

  return (
    <div className="max-w-4xl mx-auto">
      <a
        href={`/workspace/${project.workspaceId}`}
        className="text-neutral-500 text-sm hover:text-neutral-300 transition-colors"
      >
        Back to workspace
      </a>
      <div className="mt-4">
        <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
        {project.description && <p className="text-neutral-400 mt-2">{project.description}</p>}
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wider">Form</h2>
          <p className="text-neutral-500 mt-2">No form defined yet. Define your product shape.</p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wider">Modules</h2>
          <p className="text-neutral-500 mt-2">No modules defined yet.</p>
        </div>
      </div>
    </div>
  );
}
