import { z } from "zod";

export const ConstraintCheckSchema = z.object({
  conflicts: z.array(
    z.object({
      domain: z.enum(["mechanical", "electrical", "manufacturing", "assembly"]),
      severity: z.enum(["must", "should", "may"]),
      description: z.string(),
      affectedModules: z.array(z.string()).optional(),
      recommendation: z.string(),
      alternatives: z.array(z.string()).optional(),
    }),
  ),
  summary: z.string(),
});

export type ConstraintCheck = z.infer<typeof ConstraintCheckSchema>;
