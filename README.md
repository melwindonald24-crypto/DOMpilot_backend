# Agentic Forms Backend

A stateless Express API that supports the browser extension's single execution loop. It has no database, cookie session, WebSocket, screenshot store, document store, or task cache.

## Structure

```text
routes/          maps POST /analyze and POST /act only
controllers/     HTTP validation and response handling
services/        one use case per service (analysis or action decision)
ports/           interfaces consumed by services
infrastructure/  Ollama and mock model implementations
contracts.ts     shared request/response/privacy schemas
```

Controllers never select a model or contain use-case logic. Services never access Express request/response objects. Model adapters only communicate with their local runtime.

## Privacy contract

- `POST /analyze` accepts an already-redacted image data URL, minimal metadata, and a value-free DOM summary.
- `POST /act` accepts only a value-free DOM, client-owned cached context, and client-owned task state.
- Keys such as `value`, `password`, `textContent`, `innerText`, `aadhaar`, `dob`, and `documentNumber` are rejected anywhere in a request.
- The service does not log request bodies. Provider output is parsed against the same strict action/context contracts before it is returned.
- The only action payloads accepted by the executor contract are `fill`, `click`, `scroll`, `navigate`, `request_document`, and `done`.

The extension remains responsible for actual redaction, user approval, local OCR, local value lookup, action execution, action verification, context invalidation, and cleanup of task-scoped data.

## Install Ollama models

The backend expects Ollama to listen only on the local machine at
`http://127.0.0.1:11434`.

1. Install Ollama for Windows from [ollama.com/download/windows](https://ollama.com/download/windows).
2. Open PowerShell and start Ollama on the required address:
   ```powershell
   $env:OLLAMA_HOST = "127.0.0.1:11434"
   ollama serve
   ```
   Keep this terminal open. If the Ollama desktop application is already running,
   close it first so that it does not use the port.
3. In a second PowerShell window, pull the exact models required by this project:
   ```powershell
   $env:OLLAMA_HOST = "127.0.0.1:11434"
   ollama pull llama3.2-vision
   ollama pull qwen2.5:3b
   ```
4. Confirm that both models are installed:
   ```powershell
   Invoke-RestMethod http://127.0.0.1:11434/api/tags
   ```
   The response must contain `llama3.2-vision` and `qwen2.5:3b`.
5. Confirm that the text model can answer through the configured endpoint:
   ```powershell
   $body = @{ model = "qwen2.5:3b"; prompt = "Reply with OK"; stream = $false } | ConvertTo-Json
   Invoke-RestMethod http://127.0.0.1:11434/api/generate -Method Post -ContentType "application/json" -Body $body
   ```

The local project configuration in `.env` must contain:

```dotenv
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_VLM_MODEL=llama3.2-vision
OLLAMA_ACT_MODEL=qwen2.5:3b
```

## Run

1. Copy `.env.example` to `.env` if needed.
2. Install dependencies with `npm install`.
3. Run `npm run dev`.
4. Run `npm test` and `npm run build` before integrating the extension.

## Endpoints

### `POST /analyze`

The extension calls this initially and whenever its deterministic router invalidates context. It supplies a locally redacted screenshot. The response contains visual context and echoes an analysis version/fingerprint for the client to retain.

### `POST /act`

The extension calls this on the hot path with cached context and its current value-free DOM. It receives exactly one schema-validated action. A `fill` response can only name a `local:<key>` source; the extension resolves that key locally.

## Providers

The production adapter calls an Ollama instance on the same device (the default is `127.0.0.1`). Install Ollama, then download the two local models:

```powershell
ollama pull llama3.2-vision
ollama pull qwen2.5:3b
```

The adapter calls Ollama's local `/api/chat` endpoint with `stream: false`, JSON Schema format constraints, and deterministic decoding. It validates each response again before sending it to the extension. Only the redacted image is included in the VLM call.

## Model choice

Start with **Llama 3.2 Vision** for `/analyze`: it is an open-weight vision-language model with document parsing and screen-agent-oriented capabilities. Use **Qwen2.5 3B** for `/act`: it keeps the repeated value-free, structured-decision path compact and local. If the evaluation shows visual failures, trial a larger vision model on a stronger GPU before changing the architecture.

Ollama accepts base64 image data in the `images` array and supports JSON Schema output from `/api/chat`. See [Ollama's API documentation](https://docs.ollama.com/api/chat) and the [Qwen2.5-VL model documentation](https://github.com/QwenLM/Qwen2.5-VL). The privacy guarantees still depend on the extension never sending unredacted data.
