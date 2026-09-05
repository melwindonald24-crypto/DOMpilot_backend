import { randomUUID } from "node:crypto";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { ZodError } from "zod";
import { config } from "./config.js";
import { OllamaActionModel } from "./infrastructure/ollama-action.model.js";
import { OllamaVisionModel } from "./infrastructure/ollama-vision.model.js";
import type { ActionModel, VisionModel } from "./ports/model.ports.js";
import { createAgentRouter } from "./routes/agent.routes.js";
import { DefaultActionService, type ActionService } from "./services/action.service.js";
import { DefaultAnalysisService, type AnalysisService } from "./services/analysis.service.js";

type Dependencies = { analysisService: AnalysisService; actionService: ActionService };

function defaultDependencies(): Dependencies {
  const visionModel: VisionModel = new OllamaVisionModel(config.ollamaBaseUrl, config.ollamaVlmModel, config.modelTimeoutMs);
  const actionModel: ActionModel = new OllamaActionModel(config.ollamaBaseUrl, config.ollamaActModel, config.modelTimeoutMs);
  return { analysisService: new DefaultAnalysisService(visionModel), actionService: new DefaultActionService(actionModel) };
}

function errorHandler(error: unknown, request: Request, response: Response, _next: NextFunction): void {
  const requestId = request.header("x-request-id") ?? randomUUID();
  if (error instanceof ZodError) {
    response.status(400).json({ error: "invalid_request", request_id: requestId, details: error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })) });
    return;
  }
  if (error instanceof Error && error.message.startsWith("Forbidden sensitive key")) {
    response.status(400).json({ error: "privacy_contract_violation", request_id: requestId, message: "Current DOM values and sensitive fields are not accepted." });
    return;
  }
  // Never include prompts, screenshots, DOM data, provider responses, or keys in errors/logs.
  console.error(JSON.stringify({ event: "request_failed", requestId, route: request.path, message: error instanceof Error ? error.message : "unknown" }));
  response.status(502).json({ error: "reasoning_unavailable", request_id: requestId });
}

export function createApp(dependencies: Dependencies = defaultDependencies()): express.Express {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors({ origin: config.allowedOrigin ? [config.allowedOrigin] : false, methods: ["POST", "GET"], allowedHeaders: ["Content-Type", "X-Request-Id"] }));
  app.use(express.json({ limit: "12mb", strict: true }));
  app.use(rateLimit({ windowMs: config.rateLimitWindowMs, limit: config.rateLimitMax, standardHeaders: "draft-8", legacyHeaders: false }));

  app.use(createAgentRouter(dependencies));

  app.use(errorHandler);
  return app;
}
