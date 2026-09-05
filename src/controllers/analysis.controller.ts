import { randomUUID } from "node:crypto";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import { AnalyzeRequestSchema, assertNoForbiddenKeys } from "../contracts.js";
import type { AnalysisService } from "../services/analysis.service.js";

/** HTTP adapter for the analysis use case. */
export function createAnalysisController(service: AnalysisService): RequestHandler {
  return async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    const requestId = request.header("x-request-id") ?? randomUUID();
    try {
      assertNoForbiddenKeys(request.body);
      const result = await service.execute(AnalyzeRequestSchema.parse(request.body));
      response.status(200).setHeader("x-request-id", requestId).json(result);
    } catch (error) {
      next(error);
    }
  };
}
