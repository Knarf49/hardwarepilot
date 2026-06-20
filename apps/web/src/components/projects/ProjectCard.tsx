import type { ProjectModel } from "@hardwarepilot/db";
import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ProjectCard({ project }: { project: ProjectModel }) {
  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="bg-neutral-900 border-neutral-800 hover:border-[#7C5CFC]/40 transition-colors cursor-pointer">
        <CardHeader>
          <CardTitle className="text-neutral-100">{project.name}</CardTitle>
          <CardDescription className="text-neutral-500">
            {project.description ?? "No description"}
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
