import { GoogleGenerativeAI } from "@google/generative-ai";

let client = null;
function getClient() {
  if (!client) client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return client;
}

const SCORING_PROMPT = `You are grading an AI assistant's answer against a reference answer.

Question: {{QUESTION}}
Reference answer: {{EXPECTED}}
AI's answer: {{ACTUAL}}

Score the AI's answer from 1 (bad) to 5 (excellent) on accuracy (matches the
facts in the reference), relevance (addresses the question) and completeness
(covers what the reference covers). Give ONE overall integer score.

Respond with ONLY JSON, no markdown fences: {"score": <1-5 integer>, "reasoning": "<one sentence>"}`;

const JUDGE_MODEL = "gemini-3.5-flash-lite";

export async function scoreAnswer(question, expected, actual) {
  try {
    const model = getClient().getGenerativeModel({ model: JUDGE_MODEL });
    const prompt = SCORING_PROMPT.replace("{{QUESTION}}", question)
      .replace("{{EXPECTED}}", expected)
      .replace("{{ACTUAL}}", actual || "(no answer)");

    const result = await model.generateContent(prompt);
    const text = result.response
      .text()
      .trim()
      .replace(/^```(?:json)?|```$/g, "")
      .trim();

    const parsed = JSON.parse(text);
    const score = Number(parsed.score);
    return {
      score: Number.isFinite(score) ? Math.max(1, Math.min(5, score)) : 0,
      reasoning: parsed.reasoning || "",
    };
  } catch (err) {
    return { score: 0, reasoning: `Scoring failed: ${err.message}` };
  }
}
