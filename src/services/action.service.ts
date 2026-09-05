import { ActResponseSchema, type ActRequest, type ActResponse } from "../contracts.js";
import type { ActionModel } from "../ports/model.ports.js";

export interface ActionService {
  execute(request: ActRequest): Promise<ActResponse>;
}

/** Owns the single action-decision use case; it cannot execute browser actions. */
export class DefaultActionService implements ActionService {
  constructor(private readonly actionModel: ActionModel) {}

  async execute(request: ActRequest): Promise<ActResponse> {
    const action = await this.actionModel.decide(request);
    return ActResponseSchema.parse({ action });
  }
}
