"use server";

import { db } from "@hardwarepilot/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const componentTypeEnum = z.enum([
  "resistor",
  "capacitor",
  "inductor",
  "diode",
  "transistor",
  "ic",
  "connector",
  "voltage_source",
  "current_source",
  "custom",
]);

const createSchema = z.object({
  moduleId: z.string().uuid(),
  projectId: z.string().uuid(),
  type: componentTypeEnum,
  name: z.string().min(1).max(50),
  value: z.string().max(100).optional(),
  tolerance: z.string().max(50).optional(),
  partNumber: z.string().max(100).optional(),
  footprint: z.string().max(50).optional(),
  pins: z.string(),
});

const deleteSchema = z.object({
  componentId: z.string().uuid(),
  projectId: z.string().uuid(),
});

type ActionResult<T> =
  | { data: T; error: null }
  | { data: null; error: { code: string; message: string } };

export async function createComponent(
  _prev: ActionResult<unknown> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const raw = Object.fromEntries(formData);
  const parsed = createSchema.safeParse({
    ...raw,
    pins: JSON.parse((raw.pins as string) || "[]"),
  });

  if (!parsed.success) {
    return {
      data: null,
      error: { code: "VALIDATION", message: parsed.error.message },
    };
  }

  try {
    const comp = await db.component.create({
      data: {
        moduleId: parsed.data.moduleId,
        type: parsed.data.type,
        name: parsed.data.name,
        value: parsed.data.value ?? null,
        tolerance: parsed.data.tolerance ?? null,
        partNumber: parsed.data.partNumber ?? null,
        footprint: parsed.data.footprint ?? null,
        pins: parsed.data.pins,
      },
    });
    revalidatePath(`/projects/${parsed.data.projectId}/components`);
    return { data: { id: comp.id }, error: null };
  } catch {
    return {
      data: null,
      error: { code: "DB_ERROR", message: "Failed to create component" },
    };
  }
}

export async function deleteComponent(
  _prev: ActionResult<unknown> | null,
  formData: FormData,
): Promise<ActionResult<{ success: boolean }>> {
  const parsed = deleteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      data: null,
      error: { code: "VALIDATION", message: parsed.error.message },
    };
  }

  try {
    await db.component.delete({ where: { id: parsed.data.componentId } });
    revalidatePath(`/projects/${parsed.data.projectId}/components`);
    return { data: { success: true }, error: null };
  } catch {
    return {
      data: null,
      error: { code: "DB_ERROR", message: "Failed to delete component" },
    };
  }
}
