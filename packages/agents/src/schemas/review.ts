import { z } from "zod";

export const ReviewSchema = z.object({
  accessibilityIssues: z.array(
    z.object({
      severity: z.enum(["error", "warning", "info"]),
      description: z.string(),
      module: z.string().optional(),
      recommendation: z.string(),
    }),
  ),
  clearanceProblems: z.array(
    z.object({
      severity: z.enum(["error", "warning"]),
      description: z.string(),
      moduleA: z.string().optional(),
      moduleB: z.string().optional(),
      gap: z.number().optional(),
      recommendation: z.string(),
    }),
  ),
  manufacturingConcerns: z.array(
    z.object({
      severity: z.enum(["error", "warning", "info"]),
      description: z.string(),
      category: z.enum(["cost", "complexity", "tolerance", "material", "assembly"]),
      recommendation: z.string(),
    }),
  ),
  overallScore: z.enum(["pass", "pass_with_warnings", "fail"]),
  summary: z.string(),
});

export type Review = z.infer<typeof ReviewSchema>;
