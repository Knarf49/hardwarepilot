import { z } from "zod";

export const ModuleBreakdownSchema = z.object({
  modules: z.array(
    z.object({
      name: z.string(),
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
      description: z.string(),
      ports: z.array(
        z.object({
          name: z.string(),
          direction: z.enum(["in", "out", "bidirectional"]),
          protocol: z.string().optional(),
          voltage: z.number().optional(),
        }),
      ),
      estimatedDimensions: z.object({ w: z.number(), h: z.number(), d: z.number() }).optional(),
    }),
  ),
  connections: z
    .array(
      z.object({
        sourceModule: z.string(),
        sourcePort: z.string(),
        targetModule: z.string(),
        targetPort: z.string(),
        type: z.enum(["electrical", "mechanical", "placement", "manufacturing"]),
      }),
    )
    .optional(),
});

export type ModuleBreakdown = z.infer<typeof ModuleBreakdownSchema>;
