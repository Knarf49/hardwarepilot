import { ArrowRight, Box, Cpu } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getForm } from "@/lib/services/form";
import { getModules } from "@/lib/services/module";
import { getProject } from "@/lib/services/project";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
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
        <Link
          href={`/projects/${projectId}/form`}
          className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 hover:border-[#7C5CFC]/40 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#7C5CFC]/10 flex items-center justify-center">
                <Box className="w-5 h-5 text-[#7C5CFC]" />
              </div>
              <div>
                <h2 className="font-medium text-neutral-100">Form</h2>
                <p className="text-sm text-neutral-500 mt-0.5">
                  {form ? "Shape defined" : "Define product shape"}
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-neutral-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </Link>

        <Link
          href={`/projects/${projectId}/modules`}
          className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 hover:border-[#7C5CFC]/40 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#7C5CFC]/10 flex items-center justify-center">
                <Cpu className="w-5 h-5 text-[#7C5CFC]" />
              </div>
              <div>
                <h2 className="font-medium text-neutral-100">Modules</h2>
                <p className="text-sm text-neutral-500 mt-0.5">
                  {modules.length > 0
                    ? `${modules.length} module${modules.length > 1 ? "s" : ""} defined`
                    : "Define functional modules"}
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-neutral-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </Link>
      </div>
    </div>
  );
}
