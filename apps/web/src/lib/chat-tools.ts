import { db } from "@hardwarepilot/db";
import { tool } from "ai";
import { z } from "zod";

export function createChatTools(projectId: string) {
  return {
    getProjectState: tool({
      description:
        "Get the full current state of the project including all modules, components, connections, constraints, and nets.",
      inputSchema: z.object({}),
      execute: async () => {
        const modules = await db.module.findMany({
          where: { projectId },
          include: { components: true, nets: true },
        });
        const connections = await db.moduleConnection.findMany({
          where: { projectId },
        });
        const constraints = await db.constraint.findMany({
          where: { projectId },
        });
        return {
          modules: modules.map((m) => ({
            id: m.id,
            name: m.name,
            type: m.type,
            description: m.description,
            ports: m.ports,
            dimension: m.dimension,
            position: m.position,
            status: m.status,
            componentCount: m.components.length,
          })),
          connections: connections.map((c) => ({
            id: c.id,
            sourceModuleId: c.sourceModuleId,
            targetModuleId: c.targetModuleId,
            sourcePort: c.sourcePort,
            targetPort: c.targetPort,
            type: c.type,
          })),
          constraints: constraints.map((c) => ({
            id: c.id,
            domain: c.domain,
            rule: c.rule,
            priority: c.priority,
          })),
        };
      },
    }),

    createModule: tool({
      description: "Create a new module in the current project.",
      inputSchema: z.object({
        name: z.string().min(1).max(100).describe("Module name"),
        type: z
          .enum([
            "power",
            "mcu",
            "sensor",
            "display",
            "battery",
            "connectivity",
            "storage",
            "actuator",
            "custom",
          ])
          .describe("Module type"),
        description: z.string().optional().describe("What the module does"),
        ports: z
          .array(
            z.object({
              name: z.string(),
              direction: z.enum(["in", "out", "bidirectional"]),
              protocol: z.string().optional(),
              voltage: z.number().optional(),
            }),
          )
          .optional()
          .describe("Connection ports for the module"),
        dimension: z
          .object({ w: z.number(), h: z.number(), d: z.number() })
          .optional()
          .describe("Physical dimensions in mm"),
      }),
      execute: async ({ name, type, description, ports, dimension }) => {
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
        return { id: mod.id, name: mod.name, type: mod.type };
      },
    }),

    createComponent: tool({
      description: "Add a component (resistor, capacitor, IC, etc.) to a specific module.",
      inputSchema: z.object({
        moduleId: z.string().describe("ID of the module to add component to"),
        refdes: z.string().describe("Reference designator (e.g. R1, C1, U1)"),
        name: z.string().describe("Component name (e.g. 10k Resistor)"),
        type: z
          .enum([
            "resistor",
            "capacitor",
            "inductor",
            "diode",
            "transistor",
            "ic",
            "connector",
            "other",
          ])
          .describe("Component type"),
        value: z.string().optional().describe("Component value (e.g. 10k, 100nF)"),
        pins: z
          .array(z.object({ name: z.string(), number: z.number() }))
          .optional()
          .describe("Pin definitions"),
      }),
      execute: async ({ moduleId, refdes, name, type, value, pins }) => {
        const comp = await db.component.create({
          data: {
            moduleId,
            refdes,
            name,
            type,
            value: value ?? null,
            pins: pins ?? [],
          },
        });
        return { id: comp.id, refdes: comp.refdes, name: comp.name };
      },
    }),

    addConstraint: tool({
      description:
        "Add a design constraint (mechanical, electrical, manufacturing, assembly) to the project.",
      inputSchema: z.object({
        moduleId: z.string().optional().describe("Module ID if constraint is module-scoped"),
        domain: z
          .enum(["mechanical", "electrical", "manufacturing", "assembly"])
          .describe("Constraint domain"),
        rule: z.string().min(1).max(500).describe("Constraint rule text"),
        priority: z
          .enum(["must", "should", "may"])
          .default("should")
          .describe("Constraint priority"),
      }),
      execute: async ({ moduleId, domain, rule, priority }) => {
        const c = await db.constraint.create({
          data: {
            projectId,
            moduleId: moduleId ?? null,
            domain,
            rule,
            priority,
          },
        });
        return { id: c.id, domain: c.domain, rule: c.rule };
      },
    }),

    generateNetlist: tool({
      description:
        "Generate a SPICE netlist from all components and nets in the project for circuit simulation.",
      inputSchema: z.object({}),
      execute: async () => {
        const components = await db.component.findMany({
          where: { module: { projectId } },
          include: { module: { select: { name: true } } },
        });
        const nets = await db.net.findMany({
          where: { projectId },
          include: { nodes: { include: { component: true } } },
        });

        if (components.length === 0) {
          return { netlist: "* No components in project", warnings: ["No components found"] };
        }

        const lines: string[] = ["* SPICE netlist for project"];
        for (const net of nets) {
          lines.push(`* Net: ${net.name}`);
          for (const node of net.nodes) {
            lines.push(`${node.component.refdes}_${node.pinName} ...`);
          }
        }
        return {
          netlist: lines.join("\n"),
          componentCount: components.length,
          netCount: nets.length,
        };
      },
    }),
  };
}
