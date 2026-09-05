import { AnalysisContextSchema, type AnalysisContext, type AnalyzeRequest } from "../contracts.js";
import type { VisionModel } from "../ports/model.ports.js";
import { OllamaClient } from "./ollama.client.js";
import { CONTEXT_JSON_SCHEMA } from "./model-schemas.js";

/** Vision-model adapter. It sends only the caller-supplied redacted image to Ollama. */
export class OllamaVisionModel implements VisionModel {
  private readonly client: OllamaClient;

  constructor(baseUrl: string, model: string, timeoutMs: number) {
    this.client = new OllamaClient(baseUrl, model, timeoutMs);
  }

  async analyze(request: AnalyzeRequest): Promise<AnalysisContext> {
    const imageBase64 = request.redacted_screenshot.slice(request.redacted_screenshot.indexOf(",") + 1);
    const result = await this.client.structured<unknown>([
      { role: "system", content: "Analyze only the supplied already-redacted browser page. Return concise page context. Never infer, reconstruct, request, or output hidden personal data. Do not prescribe actions." },
      { role: "user", content: JSON.stringify({ page: request.page, dom_summary: request.dom_summary, task: request.task }), images: [imageBase64] }
    ], CONTEXT_JSON_SCHEMA);
    return AnalysisContextSchema.parse(result);
  }
}
