import "server-only";

import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { ReviewSchema } from "@hardwarepilot/agents/schemas/review";
import { db } from "@hardwarepilot/db";
import { generateObject } from "ai";

const apiKey = process.env.OPENCODE_API_KEY;
if (!apiKey) throw new Error("OPENCODE_API_KEY environment variable is not set");

const provider = createOpenAICompatible({
  name: "opencode-go",
  baseURL: "https://opencode.ai/zen/go/v1",
  apiKey,
});

const REVIEW_SYSTEM = `You are the Review Agent for HardwarePilot, a form-first hardware design platform.
Your role is to perform a design review covering accessibility, clearance, and manufacturing concerns.

Given a project's full state (form, modules, components, connections, constraints):
1. Accessibility: can all external ports (USB, buttons, displays, sensors) be reached by the user?
2. Clearance: are there physical collisions between modules? Is there enough space for connectors and cables?
3. Manufacturing: are there concerns about cost (too many layers, expensive materials), complexity
   (tight tolerances, exotic processes), or assembly difficulty?
4. Assign an overall score: pass, pass_with_warnings, or fail

Be specific — name the affected modules and provide actionable recommendations.
Use conservative manufacturing assumptions (standard FR4, 2-layer PCB unless stated otherwise).
Never claim any output is "production-ready" or "guaranteed manufacturable".`;

export async function runReview(projectId: string) {
  const [form, modules, components, constraints, decisions] = await Promise.all([
    db.form.findFirst({ where: { projectId } }),
    db.module.findMany({ where: { projectId } }),
    db.component.findMany({ where: { module: { projectId } } }),
    db.constraint.findMany({ where: { projectId } }),
    db.decision.findMany({ where: { projectId }, orderBy: { createdAt: "desc" }, take: 20 }),
  ]);

  const context = {
    projectId,
    form: form
      ? {
          polygon: form.polygon,
          dimension: form.dimension,
          requirements: form.requirements,
        }
      : null,
    modules: modules.map((m) => ({
      id: m.id,
      name: m.name,
      type: m.type,
      description: m.description,
      ports: m.ports,
      position: m.position,
      dimension: m.dimension,
      status: m.status,
    })),
    components: components.map((c) => ({
      id: c.id,
      moduleId: c.moduleId,
      name: c.name,
      type: c.type,
      value: c.value,
      footprint: c.footprint,
      pins: c.pins,
    })),
    constraints: constraints.map((c) => ({
      id: c.id,
      domain: c.domain,
      rule: c.rule,
      priority: c.priority,
    })),
    recentDecisions: decisions.map((d) => ({
      actor: d.actor,
      decision: d.decision,
      reason: d.reason,
    })),
  };

  const { object } = await generateObject({
    model: provider("deepseek-v4-flash"),
    system: REVIEW_SYSTEM,
    prompt: `Review this hardware design project. Here is the full state:

${JSON.stringify(context, null, 2)}

Analyze for accessibility, clearance, and manufacturing concerns. Return a structured review report.`,
    schema: ReviewSchema,
    temperature: 0.3,
  });

  const safetyChecked = {
    ...object,
    summary: object.summary
      .replace(/production-ready/gi, "ready for prototyping review")
      .replace(/guaranteed manufacturable/gi, "suitable for manufacturing review"),
  };

  const wordingWarnings: string[] = [];
  if (object.summary.match(/production-ready/i)) {
    wordingWarnings.push("Replaced 'production-ready' — see Rule 13 (manufacturing safety)");
  }
  if (object.summary.match(/guaranteed manufacturable/i)) {
    wordingWarnings.push("Replaced 'guaranteed manufacturable' — see Rule 13");
  }

  return { result: safetyChecked, wordingWarnings };
}
