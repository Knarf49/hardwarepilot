import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

const apiKey = process.env.OPENCODE_API_KEY;
if (!apiKey) throw new Error("OPENCODE_API_KEY environment variable is not set");

export const opencode = createOpenAICompatible({
  name: "opencode-go",
  baseURL: "https://opencode.ai/zen/go/v1",
  apiKey,
});

export const proModel = opencode("deepseek-v4-pro");
export const flashModel = opencode("deepseek-v4-flash");
