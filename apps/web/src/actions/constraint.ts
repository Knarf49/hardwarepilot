"use server";

import { db } from "@hardwarepilot/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const domainEnum = z.enum(["mechanical", "electrical", "manufacturing", "assembly"]);
const priorityEnum = z.enum(["must", "should", "may"]);

const createSchema = z.object({
  projectId: z.string().uuid(),
  moduleId: z.string().uuid().optional(),
  domain: domainEnum,
  rule: z.string().min(1).max(500),
  expression: z.string().optional(),
  priority: priorityEnum.default("should"),
});

const deleteSchema = z.object({
  constraintId: z.string().uuid(),
  projectId: z.string().uuid(),
});

type ActionResult<T> =
  | { data: T; error: null }
  | { data: null; error: { code: string; message: string } };

export async function createConstraint(
  _prev: ActionResult<unknown> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const raw = Object.fromEntries(formData);
  const parsed = createSchema.safeParse({
    ...raw,
    expression: raw.expression || undefined,
    moduleId: raw.moduleId || undefined,
  });

  if (!parsed.success) {
    return { data: null, error: { code: "VALIDATION", message: parsed.error.message } };
  }

  try {
    const c = await db.constraint.create({
      data: {
        projectId: parsed.data.projectId,
        moduleId: parsed.data.moduleId ?? null,
        domain: parsed.data.domain,
        rule: parsed.data.rule,
        expression: parsed.data.expression ? JSON.parse(parsed.data.expression) : null,
        priority: parsed.data.priority,
      },
    });
    revalidatePath(`/projects/${parsed.data.projectId}`);
    return { data: { id: c.id }, error: null };
  } catch {
    return { data: null, error: { code: "DB_ERROR", message: "Failed to create constraint" } };
  }
}

export async function deleteConstraint(
  _prev: ActionResult<unknown> | null,
  formData: FormData,
): Promise<ActionResult<{ success: boolean }>> {
  const parsed = deleteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { data: null, error: { code: "VALIDATION", message: parsed.error.message } };
  }

  try {
    await db.constraint.delete({ where: { id: parsed.data.constraintId } });
    revalidatePath(`/projects/${parsed.data.projectId}`);
    return { data: { success: true }, error: null };
  } catch {
    return { data: null, error: { code: "DB_ERROR", message: "Failed to delete constraint" } };
  }
}
