import { z } from "zod";

export const CircuitValidationSchema = z.object({
  topologyIssues: z.array(
    z.object({
      severity: z.enum(["error", "warning", "suggestion"]),
      description: z.string(),
      affectedComponents: z.array(z.string()).optional(),
      fix: z.string().optional(),
    }),
  ),
  componentRecommendations: z
    .array(
      z.object({
        name: z.string(),
        type: z.enum([
          "resistor",
          "capacitor",
          "inductor",
          "diode",
          "transistor",
          "ic",
          "connector",
          "voltage_source",
          "current_source",
        ]),
        value: z.string().optional(),
        footprint: z.string().optional(),
        reason: z.string(),
      }),
    )
    .optional(),
  simulationReady: z.boolean(),
  netlistSummary: z.string().optional(),
});

export type CircuitValidation = z.infer<typeof CircuitValidationSchema>;

export const SimulationResultSchema = z.object({
  success: z.boolean(),
  type: z.enum(["dc", "ac", "tran"]),
  data: z.array(
    z.object({
      time: z.number().optional(),
      frequency: z.number().optional(),
      sweep: z.number().optional(),
      signals: z.record(z.string(), z.number()),
    }),
  ),
  warnings: z.array(z.string()).optional(),
});

export type SimulationResult = z.infer<typeof SimulationResultSchema>;
