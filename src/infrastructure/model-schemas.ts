export const ACTION_JSON_SCHEMA = {
  oneOf: [
    { type: "object", additionalProperties: false, required: ["action", "field", "value_source"], properties: { action: { const: "fill" }, field: { type: "string" }, value_source: { type: "string", pattern: "^local:" } } },
    { type: "object", additionalProperties: false, required: ["action", "target"], properties: { action: { const: "click" }, target: { type: "string" } } },
    { type: "object", additionalProperties: false, required: ["action", "direction", "amount"], properties: { action: { const: "scroll" }, direction: { enum: ["up", "down"] }, amount: { type: "integer" } } },
    { type: "object", additionalProperties: false, required: ["action", "destination"], properties: { action: { const: "navigate" }, destination: { enum: ["back", "forward"] } } },
    { type: "object", additionalProperties: false, required: ["action", "document_type"], properties: { action: { const: "request_document" }, document_type: { type: "string" } } },
    { type: "object", additionalProperties: false, required: ["action"], properties: { action: { const: "done" } } }
  ]
};

export const CONTEXT_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["page_type", "visible_requirements", "visual_elements", "notes"],
  properties: {
    page_type: { type: "string" },
    visible_requirements: { type: "array", items: { type: "string" } },
    visual_elements: { type: "array", items: { type: "string" } },
    notes: { type: "array", items: { type: "string" } }
  }
};
