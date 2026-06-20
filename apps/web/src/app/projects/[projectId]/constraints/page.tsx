import { db } from "@hardwarepilot/db";
import { notFound } from "next/navigation";
import { ConstraintPanel } from "@/components/constraints/ConstraintPanel";
import { getProject } from "@/lib/services/project";

export const dynamic = "force-dynamic";

export default async function ConstraintsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const [project, constraints] = await Promise.all([
    getProject(projectId),
    db.constraint.findMany({ where: { projectId }, orderBy: { createdAt: "desc" } }),
  ]);

  if (!project) notFound();

  return (
    <div className="max-w-4xl mx-auto">
      <a
        href={`/projects/${projectId}`}
        className="text-neutral-500 text-sm hover:text-neutral-300 transition-colors"
      >
        Back to project
      </a>
      <h1 className="text-2xl font-semibold tracking-tight mt-2">{project.name} — Constraints</h1>
      <p className="text-neutral-400 mt-1">Define design rules and requirements</p>
      <div className="mt-6">
        <ConstraintPanel projectId={projectId} constraints={constraints} />
      </div>
    </div>
  );
}
