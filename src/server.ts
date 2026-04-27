import { buildPrompt } from "./prompt-builder.js";
import { OllamaApiClient } from "./ollama-api.js";
import type {
  AdapterExecutionContext,
  AdapterExecutionResult,
  EnvironmentTestCheck,
  EnvironmentTestResult,
  OllamaAdapterConfig,
  OllamaSessionMessage,
  OllamaSessionState,
} from "./types.js";

export const type = "ollama_local" as const;

export const models = [
  { id: "llama3.2", label: "Llama 3.2" },
  { id: "llama3.1", label: "Llama 3.1" },
  { id: "qwen2.5-coder", label: "Qwen 2.5 Coder" },
  { id: "qwen2.5", label: "Qwen 2.5" },
  { id: "mistral", label: "Mistral" },
  { id: "gemma3", label: "Gemma 3" },
  { id: "phi4", label: "Phi-4" },
  { id: "deepseek-r1", label: "DeepSeek R1" },
  { id: "codellama", label: "Code Llama" },
] as const;

export const agentConfigurationDoc = `# Ollama Local Adapter Configuration

## Required
- model: any model name available in your local Ollama instance
  Examples: llama3.2, qwen2.5-coder, mistral, gemma3, phi4, deepseek-r1

## Optional
- baseUrl: Ollama server URL (default: http://localhost:11434)
- maxTokens: max output tokens (default: 8192)
- temperature: sampling temperature (default: 0.7)
- timeoutMs: request timeout in ms (default: 120000)
- customSystemPrompt: append extra instructions to system prompt

## Setup
1. Install Ollama: https://ollama.com/download
2. Pull a model: ollama pull llama3.2
3. Ollama runs automatically on http://localhost:11434
4. No API key needed — it runs fully locally.

## Remote Ollama
Set baseUrl to reach a non-local Ollama instance:
  baseUrl: http://192.168.1.100:11434
`;

const MAX_HISTORY_MESSAGES = 20;

export async function execute(ctx: AdapterExecutionContext): Promise<AdapterExecutionResult> {
  const config = ctx.config as OllamaAdapterConfig;
  const client = new OllamaApiClient(config);
  const sessionState: OllamaSessionState = normalizeSession(ctx.sessionParams);

  await ctx.onLog("stdout", `[ollama] Starting run ${ctx.runId} for agent "${ctx.agent.name}"\n`);
  await ctx.onLog("stdout", `[ollama] Model: ${config.model} @ ${config.baseUrl ?? "http://localhost:11434"}\n`);

  const { system, user } = buildPrompt(ctx, config);
  const messages: OllamaSessionMessage[] = [{ role: "system", content: system }];

  if (sessionState.messageHistory?.length) {
    messages.push(...sessionState.messageHistory);
    await ctx.onLog("stdout", `[ollama] Restored ${sessionState.messageHistory.length} message(s) from session\n`);
  }

  messages.push({ role: "user", content: user });

  try {
    const result = await client.chatCompletion(messages);

    const updatedHistory = [
      ...(sessionState.messageHistory ?? []),
      { role: "user", content: user } as const,
      { role: "assistant", content: result.content } as const,
    ].slice(-MAX_HISTORY_MESSAGES);

    await ctx.onLog(
      "stdout",
      `[ollama] Completed. Tokens: ${result.usage.totalTokens} (prompt: ${result.usage.promptTokens}, completion: ${result.usage.completionTokens})\n`,
    );

    return {
      exitCode: 0,
      timedOut: false,
      usage: {
        inputTokens: result.usage.promptTokens,
        outputTokens: result.usage.completionTokens,
      },
      provider: "ollama",
      model: config.model,
      costUsd: 0,
      summary: result.content,
      sessionParams: {
        schemaVersion: 1,
        messageHistory: updatedHistory,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await ctx.onLog("stderr", `[ollama] API error: ${errorMessage}\n`);

    return {
      exitCode: 1,
      timedOut: false,
      usage: { inputTokens: 0, outputTokens: 0 },
      provider: "ollama",
      model: config.model,
      costUsd: 0,
      summary: `Error: ${errorMessage}`,
      sessionParams: sessionState,
    };
  }
}

export async function testEnvironment(ctx: AdapterExecutionContext): Promise<EnvironmentTestResult> {
  const config = ctx.config as OllamaAdapterConfig;
  const checks: EnvironmentTestCheck[] = [];
  const baseUrl = config.baseUrl ?? "http://localhost:11434";

  if (!config.model) {
    checks.push({
      code: "model_missing",
      level: "error",
      message: "adapterConfig.model is required. Example: llama3.2",
    });
  }

  const client = new OllamaApiClient(config);
  const connectionResult = await client.testConnection();

  if (!connectionResult.ok) {
    checks.push({
      code: "ollama_unreachable",
      level: "error",
      message: `Ollama is not reachable at ${baseUrl}: ${connectionResult.error}. Make sure Ollama is installed and running.`,
    });
  } else {
    checks.push({
      code: "ollama_reachable",
      level: "info",
      message: `Ollama is reachable at ${baseUrl}.`,
    });

    const availableModels = connectionResult.models ?? [];
    if (availableModels.length === 0) {
      checks.push({
        code: "no_models_pulled",
        level: "warning",
        message: `No models found. Pull one with: ollama pull ${config.model || "llama3.2"}`,
      });
    } else {
      const modelFound = availableModels.some(
        (m) => m === config.model || m.startsWith(`${config.model}:`),
      );
      if (modelFound) {
        checks.push({
          code: "model_available",
          level: "info",
          message: `Model "${config.model}" is available in Ollama.`,
        });
      } else {
        checks.push({
          code: "model_not_pulled",
          level: "error",
          message: `Model "${config.model}" is not pulled. Available: ${availableModels.join(", ")}. Run: ollama pull ${config.model}`,
        });
      }
    }
  }

  return {
    adapterType: "ollama_local",
    status: checks.some((c) => c.level === "error") ? "fail" : "pass",
    checks,
    testedAt: new Date().toISOString(),
  };
}

function normalizeSession(sessionParams: unknown): OllamaSessionState {
  const base: OllamaSessionState = { schemaVersion: 1, messageHistory: [] };
  if (!sessionParams || typeof sessionParams !== "object") {
    return base;
  }
  const candidate = sessionParams as Partial<OllamaSessionState>;
  if (!Array.isArray(candidate.messageHistory)) {
    return base;
  }
  return {
    schemaVersion: typeof candidate.schemaVersion === "number" ? candidate.schemaVersion : 1,
    messageHistory: candidate.messageHistory.filter(
      (m): m is OllamaSessionMessage =>
        typeof m === "object" &&
        m !== null &&
        (m as { role?: string }).role !== undefined &&
        ["system", "user", "assistant"].includes((m as { role: string }).role) &&
        typeof (m as { content?: unknown }).content === "string",
    ),
  };
}
