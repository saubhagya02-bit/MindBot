export const TIERS = ["fast", "smart", "economy"];
export const DEFAULT_TIER = "fast";
export const DEFAULT_PROVIDER = process.env.AI_PROVIDER || "gemini";

export const SYSTEM_PROMPT = `You are Gemini AI, a helpful, creative, and intelligent assistant.
When writing code, use proper markdown code blocks with language identifiers.
Be concise but thorough. Use markdown formatting when it helps clarity.`;

export const GENERATION = { temperature: 0.9, maxOutputTokens: 2048 };

export const MODEL_TIERS = {
  gemini: {
    fast: [
      "gemini-2.5-flash",
      "gemini-3.5-flash-lite",
      "gemini-3.1-flash-lite",
    ],
    smart: ["gemini-2.5-pro", "gemini-3.5-flash"],
    economy: ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite"],
  },
  openai: {
    fast: [process.env.OPENAI_MODEL_FAST || "gpt-4o-mini"],
    smart: [process.env.OPENAI_MODEL_SMART || "gpt-4o"],
    economy: [process.env.OPENAI_MODEL_ECONOMY || "gpt-4o-mini"],
  },
};

export const PRICING = {
  "gemini-2.5-pro": { input: 1.25, output: 10.0 },
  "gemini-2.5-flash": { input: 0.3, output: 2.5 },
  "gemini-3.1-flash-lite": { input: 0.25, output: 1.5 },
  "gpt-4o": { input: 2.5, output: 10.0 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
};
