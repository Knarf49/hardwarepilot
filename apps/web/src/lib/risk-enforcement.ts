export function getProposalAction(riskTier: string): "auto" | "approval" {
  if (riskTier === "low") return "auto";
  return "approval";
}
