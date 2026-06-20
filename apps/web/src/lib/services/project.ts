import "server-only";
import { db } from "@hardwarepilot/db";

export async function getProjects(workspaceId: string) {
  return db.project.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getProject(id: string) {
  return db.project.findUnique({ where: { id } });
}
