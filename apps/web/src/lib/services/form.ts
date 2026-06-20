import "server-only";
import { db } from "@hardwarepilot/db";

export async function getForm(projectId: string) {
  return db.form.findFirst({ where: { projectId } });
}
