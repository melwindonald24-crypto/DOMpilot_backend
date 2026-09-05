type ChatMessage = { role: "system" | "user"; content: string; images?: string[] };

/** Sole responsibility: call the local Ollama HTTP API and parse its JSON text. */
export class OllamaClient {
  constructor(
    private readonly baseUrl: string,
    private readonly model: string,
    private readonly timeoutMs: number
  ) {}

  async structured<T>(messages: ChatMessage[], schema: object): Promise<T> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      signal: AbortSignal.timeout(this.timeoutMs),
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: this.model, stream: false, format: schema, options: { temperature: 0 }, messages })
    });
    if (!response.ok) throw new Error(`Local model request failed (${response.status}).`);
    const body = (await response.json()) as { message?: { content?: string } };
    if (!body.message?.content) throw new Error("Local model returned no structured output.");
    return JSON.parse(body.message.content) as T;
  }
}
