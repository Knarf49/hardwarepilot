export function getProposalAction(riskTier: string): "auto" | "approval" {
  if (riskTier === "low") return "auto";
  return "approval";
}

const DISALLOWED_MANUFACTURING_PHRASES = [
  "production-ready",
  "production ready",
  "guaranteed manufacturable",
  "guaranteed to manufacture",
  "certified for production",
  "factory-ready",
  "factory ready",
  "mass-production ready",
  "ready for mass production",
];

const REPLACEMENTS: Record<string, string> = {
  "production-ready": "ready for prototyping review",
  "production ready": "ready for prototyping review",
  "guaranteed manufacturable": "suitable for manufacturing review",
  "guaranteed to manufacture": "suitable for manufacturing review",
  "certified for production": "pending production certification",
  "factory-ready": "ready for factory assessment",
  "factory ready": "ready for factory assessment",
  "mass-production ready": "ready for prototype validation",
  "ready for mass production": "ready for prototype validation",
};

export function sanitizeManufacturingText(text: string): {
  sanitized: string;
  warnings: string[];
} {
  const warnings: string[] = [];
  let sanitized = text;

  for (const phrase of DISALLOWED_MANUFACTURING_PHRASES) {
    const regex = new RegExp(phrase, "gi");
    if (regex.test(sanitized)) {
      warnings.push(
        `Removed "${phrase}" — Rule 13: no manufacturing claims without validation. Replaced with "${REPLACEMENTS[phrase.toLowerCase()] ?? "conservative alternative"}".`,
      );
      sanitized = sanitized.replace(regex, REPLACEMENTS[phrase.toLowerCase()] ?? "draft");
    }
  }

  return { sanitized, warnings };
}
