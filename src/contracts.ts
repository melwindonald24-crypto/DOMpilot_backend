import { z } from "zod";

/**
 * A deliberately value-free representation of a page element.  This is the
 * only DOM shape the API accepts. The extension must not serialize current
 * form values, text-area contents, or editable content.
 */
export const DomNodeSchema: z.ZodType<DomNode> = z.lazy(() =>
  z
    .object({
      ref: z.string().min(1).max(256),
      tag: z.string().min(1).max(64),
      role: z.string().max(128).optional(),
      type: z.string().max(64).optional(),
      name: z.string().max(256).optional(),
      label: z.string().max(256).optional(),
      placeholder: z.string().max(256).optional(),
      required: z.boolean().optional(),
      disabled: z.boolean().optional(),
      selector: z.string().max(1024).optional(),
      bounds: z
        .object({ x: z.number(), y: z.number(), width: z.number(), height: z.number() })
        .strict()
        .optional(),
      children: z.array(DomNodeSchema).max(200).optional()
    })
    .strict()
);

export interface DomNode {
  ref: string;
  tag: string;
  role?: string;
  type?: string;
  name?: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  selector?: string;
  bounds?: { x: number; y: number; width: number; height: number };
  children?: DomNode[];
}

export const PageMetadataSchema = z
  .object({
    url: z.string().url().max(2048),
    title: z.string().max(256).optional(),
    viewport: z
      .object({ width: z.number().int().positive(), height: z.number().int().positive() })
      .strict(),
    dom_fingerprint: z.string().min(8).max(256),
    has_visual_only_content: z.boolean().default(false)
  })
  .strict();

export const AnalyzeRequestSchema = z
  .object({
    /** A locally redacted image only. A data URL avoids a server-side file store. */
    redacted_screenshot: z.string().regex(/^data:image\/(png|jpeg|webp);base64,/, "Expected an image data URL").max(12_000_000),
    page: PageMetadataSchema,
    dom_summary: z.array(DomNodeSchema).max(500).default([]),
    task: z
      .object({
        goal: z.string().min(1).max(2000),
        action_counter: z.number().int().nonnegative()
      })
      .strict()
  })
  .strict();

export const AnalysisContextSchema = z
  .object({
    page_type: z.string().min(1).max(128),
    visible_requirements: z.array(z.string().min(1).max(256)).max(100),
    visual_elements: z.array(z.string().min(1).max(256)).max(100),
    notes: z.array(z.string().max(500)).max(20).default([])
  })
  .strict();

export const AnalyzeResponseSchema = z
  .object({
    context: AnalysisContextSchema,
    context_version: z.number().int().positive(),
    analyzed_page_fingerprint: z.string().min(8).max(256)
  })
  .strict();

const LocalValueSourceSchema = z.string().regex(/^local:[a-zA-Z][a-zA-Z0-9_.-]{0,127}$/);

export const ActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("fill"), field: z.string().min(1).max(256), value_source: LocalValueSourceSchema }).strict(),
  z.object({ action: z.literal("click"), target: z.string().min(1).max(256) }).strict(),
  z.object({ action: z.literal("scroll"), direction: z.enum(["up", "down"]), amount: z.number().int().min(1).max(5000) }).strict(),
  z.object({ action: z.literal("navigate"), destination: z.enum(["back", "forward"]) }).strict(),
  z.object({ action: z.literal("request_document"), document_type: z.string().min(1).max(128) }).strict(),
  z.object({ action: z.literal("done") }).strict()
]);

export const TaskStateSchema = z
  .object({
    goal: z.string().min(1).max(2000),
    context_version: z.number().int().positive(),
    actions_completed: z.number().int().nonnegative(),
    available_local_keys: z.array(z.string().regex(/^[a-zA-Z][a-zA-Z0-9_.-]{0,127}$/)).max(100),
    completed_fields: z.array(z.string().min(1).max(256)).max(500).default([])
  })
  .strict();

export const ActRequestSchema = z
  .object({
    page: PageMetadataSchema,
    dom: z.array(DomNodeSchema).min(1).max(500),
    context: AnalysisContextSchema,
    task_state: TaskStateSchema
  })
  .strict();

export const ActResponseSchema = z.object({ action: ActionSchema }).strict();

export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;
export type AnalysisContext = z.infer<typeof AnalysisContextSchema>;
export type AnalyzeResponse = z.infer<typeof AnalyzeResponseSchema>;
export type Action = z.infer<typeof ActionSchema>;
export type ActRequest = z.infer<typeof ActRequestSchema>;
export type ActResponse = z.infer<typeof ActResponseSchema>;

const forbiddenKeys = new Set([
  "value",
  "values",
  "password",
  "textcontent",
  "innertext",
  "innerhtml",
  "contenteditable",
  "selectedtext",
  "textarea",
  "documentnumber",
  "aadhaar",
  "dateofbirth",
  "dob"
]);

/** Defense in depth: reject rather than silently strip accidental PII fields. */
export function assertNoForbiddenKeys(input: unknown): void {
  const visit = (value: unknown, path: string): void => {
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, `${path}[${index}]`));
      return;
    }
    if (value === null || typeof value !== "object") return;
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if (forbiddenKeys.has(key.toLowerCase())) {
        throw new Error(`Forbidden sensitive key at ${path}.${key}`);
      }
      visit(nested, `${path}.${key}`);
    }
  };
  visit(input, "request");
}
