import "server-only";
import { db } from "@hardwarepilot/db";

export async function getComponents(moduleId: string) {
  return db.component.findMany({
    where: { moduleId },
    orderBy: { createdAt: "asc" },
  });
}

export async function getNets(moduleId: string) {
  return db.net.findMany({
    where: { moduleId },
    orderBy: { createdAt: "asc" },
  });
}
