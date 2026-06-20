import "server-only";
import { db } from "@hardwarepilot/db";

export async function getWorkspaces() {
  return db.workspace.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getWorkspace(id: string) {
  return db.workspace.findUnique({ where: { id } });
}
