import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "../src/app.js";
import type { ActionService } from "../src/services/action.service.js";
import type { AnalysisService } from "../src/services/analysis.service.js";

const analysisService: AnalysisService = {
  async execute(request) {
    return { context: { page_type: "government_application_form", visible_requirements: ["name"], visual_elements: [], notes: [] }, context_version: request.task.action_counter + 1, analyzed_page_fingerprint: request.page.dom_fingerprint };
  }
};
const actionService: ActionService = { async execute() { return { action: { action: "done" } }; } };
const app = createApp({ analysisService, actionService });

async function request(path: string, body: unknown): Promise<Response> {
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");
  try {
    return await fetch(`http://127.0.0.1:${address.port}${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  } finally {
    server.close();
  }
}

const page = { url: "https://example.test/form", viewport: { width: 1280, height: 720 }, dom_fingerprint: "abcdefgh12345678", has_visual_only_content: false };

test("analyze accepts only a redacted screenshot and returns context", async () => {
  const response = await request("/analyze", {
    redacted_screenshot: "data:image/png;base64,AA==",
    page,
    dom_summary: [{ ref: "name", tag: "input", name: "name", required: true }],
    task: { goal: "Complete the form", action_counter: 0 }
  });
  assert.equal(response.status, 200);
  const body = await response.json() as { context: { page_type: string } };
  assert.equal(body.context.page_type, "government_application_form");
});

test("act rejects a DOM field value instead of silently dropping it", async () => {
  const response = await request("/act", {
    page,
    dom: [{ ref: "name", tag: "input", name: "name", value: "must-not-cross-device" }],
    context: { page_type: "web_form", visible_requirements: [], visual_elements: [], notes: [] },
    task_state: { goal: "Complete the form", context_version: 1, actions_completed: 0, available_local_keys: [], completed_fields: [] }
  });
  assert.equal(response.status, 400);
  const body = await response.json() as { error: string };
  assert.equal(body.error, "privacy_contract_violation");
});

test("act accepts a value-free DOM and returns exactly one action", async () => {
  const response = await request("/act", {
    page,
    dom: [{ ref: "submit", tag: "button", role: "button", label: "Submit" }],
    context: { page_type: "web_form", visible_requirements: [], visual_elements: [], notes: [] },
    task_state: { goal: "Complete the form", context_version: 1, actions_completed: 0, available_local_keys: [], completed_fields: [] }
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { action: { action: "done" } });
});
