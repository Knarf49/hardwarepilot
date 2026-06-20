import { notFound } from "next/navigation";
import { FormWorkspace } from "@/components/forms/FormWorkspace";
import { getForm } from "@/lib/services/form";
import { getProject } from "@/lib/services/project";

export const dynamic = "force-dynamic";

export default async function FormPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const [project, form] = await Promise.all([getProject(projectId), getForm(projectId)]);

  if (!project) notFound();

  return (
    <div className="max-w-4xl mx-auto">
      <a
        href={`/projects/${projectId}`}
        className="text-neutral-500 text-sm hover:text-neutral-300 transition-colors"
      >
        Back to project
      </a>
      <h1 className="text-2xl font-semibold tracking-tight mt-2">{project.name} — Form</h1>
      <p className="text-neutral-400 mt-1">Define the physical shape of your product</p>

      <div className="mt-6">
        <FormWorkspace
          projectId={projectId}
          existingForm={
            form
              ? {
                  id: form.id,
                  vertices: (form.polygon as { vertices: { x: number; y: number }[] }).vertices,
                  dimension: form.dimension as { w: number; h: number; d: number },
                }
              : null
          }
        />
      </div>
    </div>
  );
}
