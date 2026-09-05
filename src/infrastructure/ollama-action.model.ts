import { ActionSchema, type Action, type ActRequest } from "../contracts.js";
import type { ActionModel } from "../ports/model.ports.js";
import { OllamaClient } from "./ollama.client.js";
import { ACTION_JSON_SCHEMA } from "./model-schemas.js";

/** Text-model adapter. It receives only a value-free DOM and cached context. */
export class OllamaActionModel implements ActionModel {
  private readonly client: OllamaClient;

  constructor(baseUrl: string, model: string, timeoutMs: number) {
    this.client = new OllamaClient(baseUrl, model, timeoutMs);
  }

  async decide(request: ActRequest): Promise<Action> {
    const result = await this.client.structured<unknown>([
      { role: "system", content: "Choose exactly one action for the browser extension. You receive a value-free DOM and may never ask for, infer, or return personal values. A fill action must use only an available local:<key> reference. Prefer request_document when a required local value is unavailable. Return done only when the stated goal is complete." },
      { role: "user", content: JSON.stringify({ page: request.page, dom: request.dom, context: request.context, task_state: request.task_state }) }
    ], ACTION_JSON_SCHEMA);
    return ActionSchema.parse(result);
  }
}
