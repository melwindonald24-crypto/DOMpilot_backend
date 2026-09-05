import { AnalyzeResponseSchema, type AnalyzeRequest, type AnalyzeResponse } from "../contracts.js";
import type { VisionModel } from "../ports/model.ports.js";

export interface AnalysisService {
  execute(request: AnalyzeRequest): Promise<AnalyzeResponse>;
}

/** Owns the single analysis use case; it has no HTTP or provider knowledge. */
export class DefaultAnalysisService implements AnalysisService {
  constructor(private readonly visionModel: VisionModel) {}

  async execute(request: AnalyzeRequest): Promise<AnalyzeResponse> {
    const context = await this.visionModel.analyze(request);
    return AnalyzeResponseSchema.parse({
      context,
      context_version: request.task.action_counter + 1,
      analyzed_page_fingerprint: request.page.dom_fingerprint
    });
  }
}
