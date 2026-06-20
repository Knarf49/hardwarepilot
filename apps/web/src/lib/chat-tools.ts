import { db } from "@hardwarepilot/db";
import { tool as langchainTool } from "@langchain/core/tools";
import { z } from "zod";

export function createTools(projectId: string) {
  return [
    langchainTool(
      async () => {
        const modules = await db.module.findMany({
          where: { projectId },
          include: { components: true },
        });
        const connections = await db.moduleConnection.findMany({
          where: { projectId },
        });
        const constraints = await db.constraint.findMany({
          where: { projectId },
        });
        return JSON.stringify({
          modules: modules.map((m) => ({
            id: m.id,
            name: m.name,
            type: m.type,
            description: m.description,
            ports: m.ports,
            dimension: m.dimension,
            status: m.status,
            componentCount: m.components.length,
          })),
          connections: connections.map((c) => ({
            sourceModuleId: c.sourceModuleId,
            targetModuleId: c.targetModuleId,
            sourcePortId: c.sourcePortId,
            targetPortId: c.targetPortId,
            type: c.type,
          })),
          constraints: constraints.map((c) => ({
            id: c.id,
            domain: c.domain,
            rule: c.rule,
            priority: c.priority,
          })),
        });
      },
      {
        name: "getProjectState",
        description: "Get full project state: modules, components, connections, constraints.",
        schema: z.object({}),
      },
    ),

    langchainTool(
      async ({ name, type, description, ports, dimension }) => {
        const mod = await db.module.create({
          data: {
            projectId,
            name,
            type,
            description: description ?? null,
            ports: ports ?? [],
            dimension: dimension ?? { w: 20, h: 20, d: 5 },
            status: "proposed",
          },
        });
        return JSON.stringify({ id: mod.id, name: mod.name, type: mod.type });
      },
      {
        name: "createModule",
        description: "Create a new module in the project.",
        schema: z.object({
          name: z.string().min(1).max(100),
          type: z.enum([
            "power",
            "mcu",
            "sensor",
            "display",
            "battery",
            "connectivity",
            "storage",
            "actuator",
            "custom",
          ]),
          description: z.string().optional(),
          ports: z
            .array(
              z.object({
                name: z.string(),
                direction: z.enum(["in", "out", "bidirectional"]),
                protocol: z.string().optional(),
                voltage: z.number().optional(),
              }),
            )
            .optional(),
          dimension: z.object({ w: z.number(), h: z.number(), d: z.number() }).optional(),
        }),
      },
    ),

    langchainTool(
      async ({ moduleId, name, type, value, pins }) => {
        const comp = await db.component.create({
          data: {
            moduleId,
            name,
            type,
            value: value ?? null,
            pins: pins ?? [],
          },
        });
        return JSON.stringify({ id: comp.id, name: comp.name, type: comp.type });
      },
      {
        name: "createComponent",
        description: "Add a component (resistor, capacitor, IC, etc.) to a module.",
        schema: z.object({
          moduleId: z.string(),
          name: z.string().describe("Component name (e.g. 10k Resistor, STM32F103)"),
          type: z.enum([
            "resistor",
            "capacitor",
            "inductor",
            "diode",
            "transistor",
            "ic",
            "connector",
            "other",
          ]),
          value: z.string().optional().describe("Value like 10k, 100nF"),
          pins: z.array(z.object({ name: z.string(), number: z.number() })).optional(),
        }),
      },
    ),

    langchainTool(
      async ({ moduleId, domain, rule, priority }) => {
        const c = await db.constraint.create({
          data: {
            projectId,
            moduleId: moduleId ?? null,
            domain,
            rule,
            priority,
          },
        });
        return JSON.stringify({ id: c.id, domain: c.domain, rule: c.rule });
      },
      {
        name: "addConstraint",
        description: "Add design constraint (mechanical, electrical, manufacturing, assembly).",
        schema: z.object({
          moduleId: z.string().optional(),
          domain: z.enum(["mechanical", "electrical", "manufacturing", "assembly"]),
          rule: z.string().min(1).max(500),
          priority: z.enum(["must", "should", "may"]).default("should"),
        }),
      },
    ),

    langchainTool(
      async () => {
        const components = await db.component.findMany({
          where: { module: { projectId } },
          include: { module: { select: { name: true } } },
        });
        if (components.length === 0) {
          return JSON.stringify({ netlist: "* No components in project" });
        }
        const lines = ["* SPICE netlist"];
        for (const comp of components) {
          lines.push(
            `${comp.module.name} ${comp.name} ${comp.type}${comp.value ? ` ${comp.value}` : ""}`,
          );
        }
        return JSON.stringify({ netlist: lines.join("\n"), componentCount: components.length });
      },
      {
        name: "generateNetlist",
        description: "Generate SPICE netlist from project components.",
        schema: z.object({}),
      },
    ),
  ];
}
