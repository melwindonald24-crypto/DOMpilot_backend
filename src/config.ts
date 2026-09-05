import "dotenv/config";

function positiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed) || parsed <= 0) throw new Error("Expected a positive integer configuration value.");
  return parsed;
}

export const config = {
  port: positiveInt(process.env.PORT, 3000),
  allowedOrigin: process.env.ALLOWED_ORIGIN,
  rateLimitWindowMs: positiveInt(process.env.RATE_LIMIT_WINDOW_MS, 60_000),
  rateLimitMax: positiveInt(process.env.RATE_LIMIT_MAX, 60),
  modelTimeoutMs: positiveInt(process.env.MODEL_TIMEOUT_MS, 30_000),
  ollamaBaseUrl: (process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434").replace(/\/$/, ""),
  ollamaVlmModel: process.env.OLLAMA_VLM_MODEL ?? "llama3.2-vision",
  ollamaActModel: process.env.OLLAMA_ACT_MODEL ?? "qwen2.5:3b"
} as const;
