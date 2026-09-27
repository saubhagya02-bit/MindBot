import "dotenv/config";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { generateReply } from "../services/ai/AIRouter.js";
import { scoreAnswer } from "./score.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATASET_PATH = path.join(__dirname, "dataset.json");
const RESULTS_DIR = path.join(__dirname, "results");
const THRESHOLD = Number(process.env.EVAL_SCORE_THRESHOLD || 3.5);
const TIER = process.env.EVAL_TIER || "fast";
const DELAY_MS = Number(process.env.EVAL_DELAY_MS || 1500);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const dataset = JSON.parse(await fs.readFile(DATASET_PATH, "utf-8"));
  const results = [];

  for (const item of dataset) {
    const startedAt = Date.now();
    let answer = "";
    let error = null;

    try {
      const reply = await generateReply({
        history: [],
        message: item.question,
        tier: TIER,
      });
      answer = reply.text;
    } catch (err) {
      error = err.message;
    }

    const latencyMs = Date.now() - startedAt;
    const scoring = error
      ? { score: 0, reasoning: error }
      : await scoreAnswer(item.question, item.expectedAnswer, answer);

    results.push({
      question: item.question,
      expectedAnswer: item.expectedAnswer,
      answer,
      error,
      latencyMs,
      score: scoring.score,
      reasoning: scoring.reasoning,
    });

    console.log(
      `${scoring.score}/5 — ${item.question.slice(0, 55)}${
        item.question.length > 55 ? "…" : ""
      } (${latencyMs}ms)`,
    );

    await sleep(DELAY_MS);
  }

  await fs.mkdir(RESULTS_DIR, { recursive: true });

  const avgScore =
    results.reduce((sum, r) => sum + r.score, 0) / results.length;
  const avgLatencyMs = Math.round(
    results.reduce((sum, r) => sum + r.latencyMs, 0) / results.length,
  );
  const failures = results.filter((r) => r.error || r.score < THRESHOLD);

  const report = {
    runAt: new Date().toISOString(),
    tier: TIER,
    totalQuestions: dataset.length,
    avgScore: Number(avgScore.toFixed(2)),
    avgLatencyMs,
    failureCount: failures.length,
    threshold: THRESHOLD,
    passed: avgScore >= THRESHOLD,
    results,
  };

  const outPath = path.join(RESULTS_DIR, `eval-${Date.now()}.json`);
  await fs.writeFile(outPath, JSON.stringify(report, null, 2));

  console.log(`\nAverage score: ${report.avgScore}/5 (threshold ${THRESHOLD})`);
  console.log(`Avg latency: ${avgLatencyMs}ms`);
  console.log(`Failures: ${failures.length}/${dataset.length}`);
  if (failures.length) {
    console.log("\nFailure cases:");
    failures.forEach((f) =>
      console.log(`  - [${f.score}/5] ${f.question} — ${f.reasoning}`),
    );
  }
  console.log(`\nReport saved to ${outPath}`);

  if (!report.passed) {
    console.error("\n❌ Eval run failed threshold.");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
