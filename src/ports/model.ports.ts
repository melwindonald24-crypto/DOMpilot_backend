import type { ActRequest, Action, AnalysisContext, AnalyzeRequest } from "../contracts.js";

/** Ports isolate application services from the local inference runtime. */
export interface VisionModel {
  analyze(request: AnalyzeRequest): Promise<AnalysisContext>;
}

export interface ActionModel {
  decide(request: ActRequest): Promise<Action>;
}
