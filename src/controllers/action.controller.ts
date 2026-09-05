import { randomUUID } from "node:crypto";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import { ActRequestSchema, assertNoForbiddenKeys } from "../contracts.js";
import type { ActionService } from "../services/action.service.js";

/** HTTP adapter for the action-decision use case. */
export function createActionController(service: ActionService): RequestHandler {
  return async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    const requestId = request.header("x-request-id") ?? randomUUID();
    try {
      assertNoForbiddenKeys(request.body);
      const result = await service.execute(ActRequestSchema.parse(request.body));
      response.status(200).setHeader("x-request-id", requestId).json(result);
    } catch (error) {
      next(error);
    }
  };
}
