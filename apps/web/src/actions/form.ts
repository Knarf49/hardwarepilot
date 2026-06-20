"use server";

import { db } from "@hardwarepilot/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const polygonSchema = z.object({
  vertices: z.array(z.object({ x: z.number(), y: z.number() })),
  edges: z
    .array(
      z.object({
        index: z.number(),
        curve: z
          .object({
            type: z.enum(["cubic", "quadratic"]),
            cp1: z.object({ x: z.number(), y: z.number() }),
            cp2: z.object({ x: z.number(), y: z.number() }).optional(),
          })
          .optional(),
      }),
    )
    .optional(),
});

const dimensionSchema = z.object({
  w: z.number().positive(),
  h: z.number().positive(),
  d: z.number().positive().default(5),
});

const createSchema = z.object({
  projectId: z.string().uuid(),
  vertices: z.array(z.object({ x: z.number(), y: z.number() })),
  dimension: dimensionSchema,
});

const updateSchema = z.object({
  formId: z.string().uuid(),
  projectId: z.string().uuid(),
  polygon: polygonSchema.optional(),
  dimension: dimensionSchema.optional(),
  requirements: z.string().max(2000).optional(),
});

type ActionResult<T> =
  | { data: T; error: null }
  | { data: null; error: { code: string; message: string } };

export async function createForm(
  _prev: ActionResult<unknown> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const parsed = createSchema.safeParse({
    projectId: formData.get("projectId"),
    vertices: JSON.parse(formData.get("vertices") as string),
    dimension: JSON.parse(formData.get("dimension") as string),
  });

  if (!parsed.success) {
    return { data: null, error: { code: "VALIDATION", message: parsed.error.message } };
  }

  try {
    const form = await db.form.create({
      data: {
        projectId: parsed.data.projectId,
        polygon: { vertices: parsed.data.vertices },
        dimension: parsed.data.dimension,
      },
    });
    revalidatePath(`/projects/${parsed.data.projectId}/form`);
    return { data: { id: form.id }, error: null };
  } catch {
    return { data: null, error: { code: "DB_ERROR", message: "Failed to create form" } };
  }
}

export async function updateForm(
  _prev: ActionResult<unknown> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const parsed = updateSchema.safeParse({
    formId: formData.get("formId"),
    projectId: formData.get("projectId"),
    polygon: formData.get("polygon") ? JSON.parse(formData.get("polygon") as string) : undefined,
    dimension: formData.get("dimension")
      ? JSON.parse(formData.get("dimension") as string)
      : undefined,
    requirements: formData.get("requirements") || undefined,
  });

  if (!parsed.success) {
    return { data: null, error: { code: "VALIDATION", message: parsed.error.message } };
  }

  try {
    const data: Record<string, unknown> = {};
    if (parsed.data.polygon) data.polygon = parsed.data.polygon;
    if (parsed.data.dimension) data.dimension = parsed.data.dimension;
    if (parsed.data.requirements !== undefined) data.requirements = parsed.data.requirements;

    const form = await db.form.update({
      where: { id: parsed.data.formId },
      data,
    });
    revalidatePath(`/projects/${parsed.data.projectId}/form`);
    return { data: { id: form.id }, error: null };
  } catch {
    return { data: null, error: { code: "DB_ERROR", message: "Failed to update form" } };
  }
}
