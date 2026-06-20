import type { WorkspaceModel } from "@hardwarepilot/db";
import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function WorkspaceCard({ workspace }: { workspace: WorkspaceModel }) {
  return (
    <Link href={`/workspace/${workspace.id}`}>
      <Card className="bg-neutral-900 border-neutral-800 hover:border-[#7C5CFC]/40 transition-colors cursor-pointer">
        <CardHeader>
          <CardTitle className="text-neutral-100">{workspace.name}</CardTitle>
          <CardDescription className="text-neutral-500">
            Created {new Date(workspace.createdAt).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
