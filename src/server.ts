import type {
  AdapterExecutionContext,
  AdapterExecutionResult,
  AdapterEnvironmentTestContext,
  AdapterEnvironmentTestResult,
  ServerAdapterModule,
  AdapterModel,
  AdapterConfigSchema,
} from "@paperclipai/adapter-utils";
import { buildPrompt } from "./prompt-builder.js";
import { OllamaApiClient } from "./ollama-api.js";
import { normalizeModelName, pickModel } from "./model-utils.js";
import type {
  OllamaAdapterConfig,
  OllamaSessionMessage,
  OllamaSessionState,
} from "./types.js";

const ADAPTER_TYPE = "ollama_local" as const;

const MAX_HISTORY_MESSAGES = 20;

export const models: AdapterModel[] = [
  { id: "llama3.2", label: "Llama 3.2" },
  { id: "llama3.1", label: "Llama 3.1" },
  { id: "qwen2.5-coder", label: "Qwen 2.5 Coder" },
  { id: "qwen2.5", label: "Qwen 2.5" },
  { id: "mistral", label: "Mistral" },
  { id: "gemma3", label: "Gemma 3" },
  { id: "phi4", label: "Phi-4" },
  { id: "deepseek-r1", label: "DeepSeek R1" },
  { id: "codellama", label: "Code Llama" },
];

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
1. Install Ollama: curl -fsSL https://ollama.com/install.sh | sh
2. Pull a model: ollama pull llama3.2
3. Ollama runs automatically on http://localhost:11434
4. No API key needed.

## Remote Ollama
Set baseUrl to reach a non-local Ollama instance:
  baseUrl: http://192.168.1.100:11434
`;

function normalizeSession(sessionParams: Record<string, unknown> | null): OllamaSessionState {
  const base: OllamaSessionState = { schemaVersion: 1, messageHistory: [] };
  if (!sessionParams) return base;
  const candidate = sessionParams as Partial<OllamaSessionState>;
  if (!Array.isArray(candidate.messageHistory)) return base;
  return {
    schemaVersion: typeof candidate.schemaVersion === "number" ? candidate.schemaVersion : 1,
    messageHistory: candidate.messageHistory.filter(
      (m): m is OllamaSessionMessage =>
        typeof m === "object" &&
        m !== null &&
        ["system", "user", "assistant"].includes((m as { role: string }).role) &&
        typeof (m as { content?: unknown }).content === "string",
    ),
  };
}

async function execute(ctx: AdapterExecutionContext): Promise<AdapterExecutionResult> {
  const config = ctx.config as unknown as OllamaAdapterConfig;
  const baseUrl = config.baseUrl ?? "http://localhost:11434";
  const sessionState: OllamaSessionState = normalizeSession(ctx.runtime.sessionParams);

  let resolvedModel = config.model ? normalizeModelName(config.model) : "";
  if (!resolvedModel) {
    const connectionResult = await new OllamaApiClient(config).testConnection();
    const fallback = pickModel(undefined, connectionResult.models ?? []);
    if (fallback.model) {
      resolvedModel = fallback.model;
      await ctx.onLog("stdout", `[ollama] Model was not set. Using first available model: ${resolvedModel}\n`);
    }
  }

  if (!resolvedModel) {
    const errorMessage = "No model selected and no local Ollama models found. Pull one with: ollama pull llama3.2";
    await ctx.onLog("stderr", `[ollama] API error: ${errorMessage}\n`);
    return {
      exitCode: 1,
      signal: null,
      timedOut: false,
      usage: { inputTokens: 0, outputTokens: 0 },
      provider: "ollama",
      model: "unknown",
      costUsd: 0,
      summary: `Error: ${errorMessage}`,
      sessionParams: sessionState as unknown as Record<string, unknown>,
    };
  }

  const runtimeConfig: OllamaAdapterConfig = { ...config, model: resolvedModel };
  const client = new OllamaApiClient(runtimeConfig);

  await ctx.onLog("stdout", `[ollama] Starting run ${ctx.runId} for agent "${ctx.agent.name}"\n`);
  await ctx.onLog("stdout", `[ollama] Model: ${resolvedModel} @ ${baseUrl}\n`);

  const { system, user } = buildPrompt(ctx, runtimeConfig);
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
      signal: null,
      timedOut: false,
      usage: {
        inputTokens: result.usage.promptTokens,
        outputTokens: result.usage.completionTokens,
      },
      provider: "ollama",
      model: resolvedModel,
      costUsd: 0,
      summary: result.content,
      sessionParams: {
        schemaVersion: 1,
        messageHistory: updatedHistory,
      } as unknown as Record<string, unknown>,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await ctx.onLog("stderr", `[ollama] API error: ${errorMessage}\n`);

    return {
      exitCode: 1,
      signal: null,
      timedOut: false,
      usage: { inputTokens: 0, outputTokens: 0 },
      provider: "ollama",
      model: resolvedModel,
      costUsd: 0,
      summary: `Error: ${errorMessage}`,
      sessionParams: sessionState as unknown as Record<string, unknown>,
    };
  }
}

async function testEnvironment(ctx: AdapterEnvironmentTestContext): Promise<AdapterEnvironmentTestResult> {
  const config = ctx.config as unknown as OllamaAdapterConfig;
  const baseUrl = config.baseUrl ?? "http://localhost:11434";
  const checks: AdapterEnvironmentTestResult["checks"] = [];
  const configuredModel = config.model ? normalizeModelName(config.model) : "";

  const client = new OllamaApiClient(config);
  const connectionResult = await client.testConnection();

  if (!connectionResult.ok) {
    checks.push({
      code: "ollama_unreachable",
      level: "error",
      message: `Ollama is not reachable at ${baseUrl}: ${connectionResult.error}. Install with: curl -fsSL https://ollama.com/install.sh | sh`,
    });
  } else {
    checks.push({
      code: "ollama_reachable",
      level: "info",
      message: `Ollama is reachable at ${baseUrl}.`,
    });

    const availableModels = connectionResult.models ?? [];
    const normalizedAvailableModels = availableModels.map((m) => normalizeModelName(m));

    if (availableModels.length === 0) {
      checks.push({
        code: "no_models_pulled",
        level: "warn",
        message: `No models found. Pull one with: ollama pull ${configuredModel || "llama3.2"}`,
      });
    } else {
      if (!configuredModel) {
        const fallbackModel = normalizeModelName(availableModels[0]);
        checks.push({
          code: "model_defaulted",
          level: "info",
          message: `adapterConfig.model is empty. Using first available model: "${fallbackModel}".`,
        });
      } else if (normalizedAvailableModels.includes(configuredModel)) {
        checks.push({
          code: "model_available",
          level: "info",
          message: `Model "${configuredModel}" is available in Ollama.`,
        });
      } else {
        checks.push({
          code: "model_not_pulled",
          level: "error",
          message: `Model "${configuredModel}" is not pulled. Available: ${availableModels.join(", ")}. Run: ollama pull ${configuredModel}`,
        });
      }
    }
  }

  return {
    adapterType: ADAPTER_TYPE,
    status: checks.some((c) => c.level === "error") ? "fail" : "pass",
    checks,
    testedAt: new Date().toISOString(),
  };
}

async function listModels(): Promise<AdapterModel[]> {
  try {
    const client = new OllamaApiClient({} as OllamaAdapterConfig);
    const result = await client.testConnection();
    if (!result.ok || !result.models?.length) return models;
    return result.models.map((name) => ({
      id: name.replace(/:latest$/, ""),
      label: name.replace(/:latest$/, ""),
    }));
  } catch {
    return models;
  }
}

async function getConfigSchema(): Promise<AdapterConfigSchema> {
  // Fetch live models from Ollama for the dropdown; fall back to curated list
  let modelOptions: Array<{ label: string; value: string }> = [];
  try {
    const client = new OllamaApiClient({} as OllamaAdapterConfig);
    const result = await client.testConnection();
    if (result.ok && result.models?.length) {
      modelOptions = result.models.map((name) => {
        const id = name.replace(/:latest$/, "");
        return { value: id, label: id };
      });
    }
  } catch {
    // ignore
  }
  if (modelOptions.length === 0) {
    modelOptions = models.map((m) => ({ value: m.id, label: m.label }));
  }
  const defaultModel = modelOptions[0]?.value;

  return {
    fields: [
      {
        key: "model",
        label: "Model",
        type: "select",
        options: modelOptions,
        default: defaultModel,
        required: true,
        hint: "Model name from your Ollama instance. Pull with: ollama pull llama3.2",
      },
      {
        key: "baseUrl",
        label: "Ollama URL",
        type: "text",
        default: "http://localhost:11434",
        hint: "Leave blank for local Ollama. Set to remote host for GPU server.",
      },
      {
        key: "temperature",
        label: "Temperature",
        type: "number",
        default: 0.7,
        hint: "Sampling temperature (0.0–2.0). Lower = more deterministic.",
      },
      {
        key: "maxTokens",
        label: "Max tokens",
        type: "number",
        default: 8192,
        hint: "Maximum tokens in the response.",
      },
      {
        key: "customSystemPrompt",
        label: "Custom system prompt",
        type: "textarea",
        hint: "Extra instructions appended to the system prompt.",
      },
    ],
  };
}

export function createServerAdapter(): ServerAdapterModule {
  return {
    type: ADAPTER_TYPE,
    execute,
    testEnvironment,
    models,
    listModels,
    getConfigSchema,
    agentConfigurationDoc,
    supportsLocalAgentJwt: false,
    supportsInstructionsBundle: false,
    requiresMaterializedRuntimeSkills: false,
  };
}
