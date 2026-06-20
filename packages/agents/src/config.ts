import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

const apiKey = process.env.OPENROUTER_API_KEY;
if (!apiKey) throw new Error("OPENROUTER_API_KEY environment variable is not set");

export const openrouter = createOpenAICompatible({
  name: "openrouter",
  baseURL: "https://openrouter.ai/api/v1",
  apiKey,
});

export const proModel = openrouter("nvidia/nemotron-3-super-120b-a12b:free");
export const flashModel = openrouter("openai/gpt-oss-120b:free");
