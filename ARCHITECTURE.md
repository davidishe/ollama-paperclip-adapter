# Ollama Adapter Architecture

## Runtime flow

1. Paperclip heartbeat invokes `execute()` from `src/server.ts` for adapter type `ollama_local`.
2. Adapter builds prompt from runtime context (`src/prompt-builder.ts`).
3. Adapter sends chat request to local Ollama `/api/chat` endpoint (`src/ollama-api.ts`).
4. Adapter returns summary, token usage, and updated `sessionParams` back to Paperclip.
5. Optional UI parser (`src/client.ts`) converts log lines into structured transcript entries.

## Integration points in Paperclip

- Server registry: add `ollama_local` mapping to `execute`, `testEnvironment`, `models`, `agentConfigurationDoc`.
- UI registry (optional): add `parseTranscript` for rich run details.
- Agent config: set `adapterType: "ollama_local"` and configure `model`/`baseUrl` in `adapterConfig`.
- No secrets required — Ollama is unauthenticated by default.

## Key differences from cloud adapters

- `costUsd` is always `0` (local inference).
- No API key — authentication is not needed.
- `baseUrl` defaults to `http://localhost:11434` but supports remote Ollama servers.
- `testEnvironment` probes Ollama's `/api/tags` endpoint and checks whether the configured model is pulled.
- Ollama's `/api/chat` returns token counts as `prompt_eval_count` and `eval_count`.

## Session and safety

- Session history is capped (`MAX_HISTORY_MESSAGES = 20`) to avoid prompt bloat.
- Health checks validate Ollama reachability and model availability.
- API client enforces request timeout and structured response validation (Zod).

## Validation performed

- `npm run build` (TypeScript compile) passed.
- `npm test` (11 Vitest tests for prompt builder and transcript parser) passed.
- Live Ollama integration test available via `testEnvironment()` — requires Ollama running locally with the configured model pulled.
