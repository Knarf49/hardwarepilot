import "server-only";
import { db } from "@hardwarepilot/db";

export async function getModules(projectId: string) {
  return db.module.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getModule(id: string) {
  return db.module.findUnique({ where: { id } });
}
