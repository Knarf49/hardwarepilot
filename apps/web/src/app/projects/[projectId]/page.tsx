import { db } from "@hardwarepilot/db";
import { Activity, ArrowRight, Box, ClipboardCheck, Cpu, FileText, Gavel, ListChecks } from "lucide-react";
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
  const [project, form, modules, constraints, decisions] = await Promise.all([
    getProject(projectId),
    getForm(projectId),
    getModules(projectId),
    db.constraint.findMany({ where: { projectId } }),
    db.decision.findMany({ where: { projectId }, orderBy: { createdAt: "desc" } }),
  ]);

  if (!project) notFound();

  const sections = [
    {
      href: `/projects/${projectId}/form`,
      icon: Box,
      title: "Form",
      subtitle: form ? "Shape defined" : "Define product shape",
    },
    {
      href: `/projects/${projectId}/modules`,
      icon: Cpu,
      title: "Modules",
      subtitle:
        modules.length > 0
          ? `${modules.length} module${modules.length > 1 ? "s" : ""} defined`
          : "Define functional modules",
    },
    {
      href: `/projects/${projectId}/components`,
      icon: ListChecks,
      title: "Components",
      subtitle: "Define components & nets inside modules",
    },
    {
      href: `/projects/${projectId}/constraints`,
      icon: Gavel,
      title: "Constraints",
      subtitle:
        constraints.length > 0
          ? `${constraints.length} rule${constraints.length > 1 ? "s" : ""} defined`
          : "Define design rules",
    },
    {
      href: `/projects/${projectId}/simulation`,
      icon: Activity,
      title: "Simulation",
      subtitle: "DC operating point analysis & SPICE netlist",
    },
    {
      href: `/projects/${projectId}/enclosure`,
      icon: Box,
      title: "Enclosure",
      subtitle: "3D preview & STL export",
    },
    {
      href: `/projects/${projectId}/review`,
      icon: ClipboardCheck,
      title: "Design Review",
      subtitle: "Accessibility, clearance & manufacturing check",
    },
  ];

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
        {sections.map(({ href, icon: Icon, title, subtitle }) => (
          <Link
            key={href}
            href={href}
            className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 hover:border-[#7C5CFC]/40 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#7C5CFC]/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-[#7C5CFC]" />
                </div>
                <div>
                  <h2 className="font-medium text-neutral-100">{title}</h2>
                  <p className="text-sm text-neutral-500 mt-0.5">{subtitle}</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-neutral-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </Link>
        ))}
      </div>

      {decisions.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Decision Log
          </h2>
          <div className="space-y-2">
            {decisions.slice(0, 5).map((d) => (
              <div key={d.id} className="p-3 rounded-lg border border-neutral-800 bg-neutral-900">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-xs font-medium px-1.5 py-0.5 rounded ${d.actor === "ai" ? "bg-[#7C5CFC]/10 text-[#7C5CFC]" : "bg-neutral-800 text-neutral-400"}`}
                  >
                    {d.actor}
                  </span>
                  <span className="text-xs text-neutral-600">
                    {d.createdAt instanceof Date ? d.createdAt.toLocaleDateString() : ""}
                  </span>
                </div>
                <p className="text-sm text-neutral-300">{d.decision}</p>
                {d.reason && <p className="text-xs text-neutral-500 mt-1">{d.reason}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
