import { z } from "zod";

export const ProjectIntentSchema = z.object({
  productType: z.string(),
  formDescription: z.string(),
  modules: z.array(
    z.object({
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
      name: z.string(),
      role: z.string(),
      requirements: z.array(z.string()).optional(),
    }),
  ),
  constraints: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export type ProjectIntent = z.infer<typeof ProjectIntentSchema>;
