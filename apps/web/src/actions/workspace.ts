"use server";

import { db } from "@hardwarepilot/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(100),
});

export async function createWorkspace(formData: FormData) {
  const { name } = createSchema.parse(Object.fromEntries(formData));
  const ws = await db.workspace.create({ data: { name } });
  revalidatePath("/");
  redirect(`/workspace/${ws.id}`);
}
