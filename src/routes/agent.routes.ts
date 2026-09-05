import { Router, type RequestHandler } from "express";
import { createActionController } from "../controllers/action.controller.js";
import { createAnalysisController } from "../controllers/analysis.controller.js";
import type { ActionService } from "../services/action.service.js";
import type { AnalysisService } from "../services/analysis.service.js";

type RouteDependencies = { analysisService: AnalysisService; actionService: ActionService };

const healthCheck: RequestHandler = (_req, res) => {
  res.json({ status: "ok", stateless: true });
};

/** The complete public API: two agent routes + health. */
export function createAgentRouter({ analysisService, actionService }: RouteDependencies): Router {
  const router = Router();
  router.get("/health", healthCheck);
  router.post("/analyze", createAnalysisController(analysisService));
  router.post("/act", createActionController(actionService));
  return router;
}
