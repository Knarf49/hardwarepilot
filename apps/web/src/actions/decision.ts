"use server";

import { db } from "@hardwarepilot/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

type ActionResult<T> =
  | { data: T; error: null }
  | { data: null; error: { code: string; message: string } };

const createProposalSchema = z.object({
  projectId: z.string().uuid(),
  agentType: z.string(),
  riskTier: z.enum(["low", "medium", "high"]),
  title: z.string().min(1),
  description: z.string().min(1),
  reason: z.string().min(1),
  tradeoffs: z.string().optional(),
  alternatives: z.string().optional(),
  affectedNodes: z.string().optional(),
});

const updateProposalSchema = z.object({
  proposalId: z.string().uuid(),
  status: z.enum(["approved", "rejected"]),
  projectId: z.string().uuid(),
});

const logDecisionSchema = z.object({
  projectId: z.string().uuid(),
  actor: z.string(),
  decision: z.string().min(1),
  reason: z.string().min(1),
  tradeoffs: z.string().optional(),
  alternatives: z.string().optional(),
  affectedNodeType: z.string().optional(),
  affectedNodeId: z.string().optional(),
});

export async function createProposal(
  _prev: ActionResult<unknown> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const raw = Object.fromEntries(formData);
  const parsed = createProposalSchema.safeParse(raw);

  if (!parsed.success) {
    return { data: null, error: { code: "VALIDATION", message: parsed.error.message } };
  }

  try {
    const proposal = await db.aIProposal.create({
      data: {
        projectId: parsed.data.projectId,
        agentType: parsed.data.agentType,
        riskTier: parsed.data.riskTier,
        title: parsed.data.title,
        description: parsed.data.description,
        reason: parsed.data.reason,
        tradeoffs: parsed.data.tradeoffs ?? null,
        alternatives: parsed.data.alternatives ? JSON.parse(parsed.data.alternatives) : null,
        affectedNodes: parsed.data.affectedNodes ? JSON.parse(parsed.data.affectedNodes) : null,
      },
    });
    revalidatePath(`/projects/${parsed.data.projectId}`);
    return { data: { id: proposal.id }, error: null };
  } catch {
    return { data: null, error: { code: "DB_ERROR", message: "Failed to create proposal" } };
  }
}

export async function updateProposalStatus(
  _prev: ActionResult<unknown> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string; status: string }>> {
  const parsed = updateProposalSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { data: null, error: { code: "VALIDATION", message: parsed.error.message } };
  }

  try {
    const proposal = await db.aIProposal.update({
      where: { id: parsed.data.proposalId },
      data: { status: parsed.data.status },
    });
    revalidatePath(`/projects/${parsed.data.projectId}`);
    return { data: { id: proposal.id, status: proposal.status }, error: null };
  } catch {
    return { data: null, error: { code: "DB_ERROR", message: "Failed to update proposal" } };
  }
}

export async function logDecision(
  _prev: ActionResult<unknown> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const parsed = logDecisionSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { data: null, error: { code: "VALIDATION", message: parsed.error.message } };
  }

  try {
    const decision = await db.decision.create({
      data: {
        projectId: parsed.data.projectId,
        actor: parsed.data.actor,
        decision: parsed.data.decision,
        reason: parsed.data.reason,
        tradeoffs: parsed.data.tradeoffs ?? null,
        alternatives: parsed.data.alternatives ? JSON.parse(parsed.data.alternatives) : null,
        affectedNodeType: parsed.data.affectedNodeType ?? null,
        affectedNodeId: parsed.data.affectedNodeId ?? null,
      },
    });
    revalidatePath(`/projects/${parsed.data.projectId}`);
    return { data: { id: decision.id }, error: null };
  } catch {
    return { data: null, error: { code: "DB_ERROR", message: "Failed to log decision" } };
  }
}
