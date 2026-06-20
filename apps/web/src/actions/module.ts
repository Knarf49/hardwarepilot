"use server";

import { db } from "@hardwarepilot/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { moduleTemplates } from "@/lib/templates/modules";

const moduleTypeEnum = z.enum([
  "power",
  "mcu",
  "sensor",
  "display",
  "battery",
  "connectivity",
  "storage",
  "actuator",
  "custom",
]);

const portSchema = z.object({
  portId: z.string(),
  name: z.string().min(1),
  direction: z.enum(["in", "out", "bidirectional"]),
  protocol: z.string().optional(),
  voltage: z.number().optional(),
});

const createSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1).max(100),
  type: moduleTypeEnum,
  description: z.string().max(500).optional(),
  ports: z.array(portSchema).default([]),
  position: z.string().optional(),
  rotation: z.string().optional(),
  dimension: z.string(),
});

const updateSchema = z.object({
  moduleId: z.string().uuid(),
  projectId: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  type: moduleTypeEnum.optional(),
  description: z.string().max(500).optional(),
  ports: z.string().optional(),
  position: z.string().optional(),
  rotation: z.string().optional(),
  dimension: z.string().optional(),
  status: z.enum(["proposed", "placed", "validated", "rejected"]).optional(),
});

const deleteSchema = z.object({
  moduleId: z.string().uuid(),
  projectId: z.string().uuid(),
});

type ActionResult<T> =
  | { data: T; error: null }
  | { data: null; error: { code: string; message: string } };

export async function createModule(
  _prev: ActionResult<unknown> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const raw = Object.fromEntries(formData);
  const parsed = createSchema.safeParse({
    ...raw,
    ports: JSON.parse((raw.ports as string) || "[]"),
    dimension: JSON.parse(raw.dimension as string),
    position: raw.position || undefined,
    rotation: raw.rotation || undefined,
  });

  if (!parsed.success) {
    return { data: null, error: { code: "VALIDATION", message: parsed.error.message } };
  }

  try {
    const mod = await db.module.create({
      data: {
        projectId: parsed.data.projectId,
        name: parsed.data.name,
        type: parsed.data.type,
        description: parsed.data.description ?? null,
        ports: parsed.data.ports,
        position: parsed.data.position ? JSON.parse(parsed.data.position) : null,
        rotation: parsed.data.rotation ? JSON.parse(parsed.data.rotation) : null,
        dimension: JSON.parse(parsed.data.dimension),
      },
    });
    revalidatePath(`/projects/${parsed.data.projectId}/modules`);
    return { data: { id: mod.id }, error: null };
  } catch {
    return { data: null, error: { code: "DB_ERROR", message: "Failed to create module" } };
  }
}

export async function updateModule(
  _prev: ActionResult<unknown> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const raw = Object.fromEntries(formData);
  const parsed = updateSchema.safeParse({
    ...raw,
    position: raw.position || undefined,
    rotation: raw.rotation || undefined,
    dimension: raw.dimension || undefined,
    ports: raw.ports || undefined,
  });

  if (!parsed.success) {
    return { data: null, error: { code: "VALIDATION", message: parsed.error.message } };
  }

  try {
    const data: Record<string, unknown> = {};
    if (parsed.data.name) data.name = parsed.data.name;
    if (parsed.data.type) data.type = parsed.data.type;
    if (parsed.data.description !== undefined) data.description = parsed.data.description;
    if (parsed.data.status) data.status = parsed.data.status;
    if (parsed.data.ports) data.ports = JSON.parse(parsed.data.ports);
    if (parsed.data.position) data.position = JSON.parse(parsed.data.position);
    if (parsed.data.rotation) data.rotation = JSON.parse(parsed.data.rotation);
    if (parsed.data.dimension) data.dimension = JSON.parse(parsed.data.dimension);

    const mod = await db.module.update({
      where: { id: parsed.data.moduleId },
      data,
    });
    revalidatePath(`/projects/${parsed.data.projectId}/modules`);
    return { data: { id: mod.id }, error: null };
  } catch {
    return { data: null, error: { code: "DB_ERROR", message: "Failed to update module" } };
  }
}

export async function deleteModule(
  _prev: ActionResult<unknown> | null,
  formData: FormData,
): Promise<ActionResult<{ success: boolean }>> {
  const parsed = deleteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { data: null, error: { code: "VALIDATION", message: parsed.error.message } };
  }

  try {
    await db.module.delete({ where: { id: parsed.data.moduleId } });
    revalidatePath(`/projects/${parsed.data.projectId}/modules`);
    return { data: { success: true }, error: null };
  } catch {
    return { data: null, error: { code: "DB_ERROR", message: "Failed to delete module" } };
  }
}

export async function saveModulePosition(formData: FormData) {
  const moduleId = formData.get("moduleId") as string;
  const projectId = formData.get("projectId") as string;
  const positionRaw = formData.get("position") as string;
  if (!moduleId || !positionRaw) return;

  const position = JSON.parse(positionRaw);
  await db.module.update({
    where: { id: moduleId },
    data: { position },
  });
  revalidatePath(`/projects/${projectId}/modules`);
}

export async function createModuleFromTemplate(
  _prev: ActionResult<unknown> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const projectId = formData.get("projectId") as string;
  const templateIndex = Number(formData.get("templateIndex"));

  if (!projectId || Number.isNaN(templateIndex)) {
    return {
      data: null,
      error: { code: "VALIDATION", message: "Missing projectId or templateIndex" },
    };
  }

  const template = moduleTemplates[templateIndex];
  if (!template) {
    return {
      data: null,
      error: { code: "VALIDATION", message: "Invalid template index" },
    };
  }

  try {
    const mod = await db.module.create({
      data: {
        projectId,
        name: template.name,
        type: template.type,
        description: template.description,
        ports: template.ports,
        dimension: template.dimension,
      },
    });
    revalidatePath(`/projects/${projectId}/modules`);
    return { data: { id: mod.id }, error: null };
  } catch {
    return {
      data: null,
      error: { code: "DB_ERROR", message: "Failed to create module from template" },
    };
  }
}
