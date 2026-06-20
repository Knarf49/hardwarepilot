import { db } from "@hardwarepilot/db";
import { tool } from "ai";
import { z } from "zod";

export function createTools(projectId: string) {
  return {
    getProjectState: tool({
      description:
        "Get full project state: all modules with their components, inter-module connections, and design constraints. Use when the user asks to see, view, show, or check the project, or when you need current state before making changes.",
      inputSchema: z.object({}),
      execute: async () => {
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
        return {
          modules: modules.map((m) => ({
            id: m.id,
            name: m.name,
            type: m.type,
            description: m.description,
            ports: m.ports,
            dimension: m.dimension,
            status: m.status,
            componentCount: m.components.length,
            components: m.components.map((c) => ({
              id: c.id,
              name: c.name,
              type: c.type,
              value: c.value,
            })),
          })),
          connections: connections.map((c) => ({
            id: c.id,
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
        };
      },
    }),

    createModule: tool({
      description:
        "Create a new module in the project (e.g. MCU, power supply, sensor block, display driver). Use when the user asks to add or create a module.",
      inputSchema: z.object({
        name: z.string().min(1).max(100).describe("Human-readable module name"),
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
          .describe("Module functional category"),
        description: z.string().optional().describe("Short purpose statement"),
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
          .describe("External ports/pins exposed by this module"),
        dimension: z
          .object({ w: z.number(), h: z.number(), d: z.number() })
          .optional()
          .describe("Bounding box in millimeters"),
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
        return { id: mod.id, name: mod.name, type: mod.type, status: mod.status };
      },
    }),

    createComponent: tool({
      description:
        "Add a component (resistor, capacitor, IC, connector, etc.) to an existing module. Use when the user asks to add a part or component.",
      inputSchema: z.object({
        moduleId: z.string().describe("UUID of the parent module"),
        name: z.string().describe("Component name (e.g. '10k Resistor', 'STM32F103')"),
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
          .describe("Component category"),
        value: z.string().optional().describe("Value like '10k', '100nF'"),
        pins: z
          .array(z.object({ name: z.string(), number: z.number() }))
          .optional()
          .describe("Pinout if known"),
      }),
      execute: async ({ moduleId, name, type, value, pins }) => {
        const comp = await db.component.create({
          data: {
            moduleId,
            name,
            type,
            value: value ?? null,
            pins: pins ?? [],
          },
        });
        return { id: comp.id, name: comp.name, type: comp.type };
      },
    }),

    addConstraint: tool({
      description:
        "Add a design constraint (mechanical, electrical, manufacturing, or assembly). Use when the user specifies a requirement, limit, or rule the design must satisfy.",
      inputSchema: z.object({
        moduleId: z
          .string()
          .optional()
          .describe("UUID of the module this constraint applies to, if scoped"),
        domain: z
          .enum(["mechanical", "electrical", "manufacturing", "assembly"])
          .describe("Constraint domain"),
        rule: z.string().min(1).max(500).describe("Human-readable rule statement"),
        priority: z
          .enum(["must", "should", "may"])
          .default("should")
          .describe("Priority level: must=hard, should=soft, may=optional"),
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
        return { id: c.id, domain: c.domain, rule: c.rule, priority: c.priority };
      },
    }),

    generateNetlist: tool({
      description:
        "Generate a SPICE netlist from all components in the project. Use when the user asks for a netlist, SPICE export, or simulation-ready component list.",
      inputSchema: z.object({}),
      execute: async () => {
        const components = await db.component.findMany({
          where: { module: { projectId } },
          include: { module: { select: { name: true } } },
        });
        if (components.length === 0) {
          return { netlist: "* No components in project", componentCount: 0 };
        }
        const lines = ["* SPICE netlist"];
        for (const comp of components) {
          lines.push(
            `${comp.module.name} ${comp.name} ${comp.type}${comp.value ? ` ${comp.value}` : ""}`,
          );
        }
        return { netlist: lines.join("\n"), componentCount: components.length };
      },
    }),
  };
}
