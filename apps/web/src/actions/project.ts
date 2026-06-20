"use server";

import { db } from "@hardwarepilot/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const createSchema = z.object({
  workspaceId: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
});

export async function createProject(formData: FormData) {
  const { workspaceId, name, description } = createSchema.parse(Object.fromEntries(formData));
  const project = await db.project.create({
    data: { name, description: description ?? null, workspaceId },
  });
  revalidatePath(`/workspace/${workspaceId}`);
  redirect(`/projects/${project.id}`);
}

const deleteSchema = z.object({
  projectId: z.string().uuid(),
  workspaceId: z.string().uuid(),
});

export async function deleteProject(formData: FormData) {
  const { projectId, workspaceId } = deleteSchema.parse(Object.fromEntries(formData));
  await db.project.delete({ where: { id: projectId } });
  revalidatePath(`/workspace/${workspaceId}`);
}
