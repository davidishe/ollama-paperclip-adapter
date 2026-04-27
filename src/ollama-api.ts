import { z } from "zod";
import type { OllamaAdapterConfig, OllamaApiResult, OllamaUsage } from "./types.js";

const DEFAULT_BASE_URL = "http://localhost:11434";

const messageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string(),
});

const responseSchema = z.object({
  message: messageSchema,
  prompt_eval_count: z.number().optional(),
  eval_count: z.number().optional(),
  done: z.boolean(),
});

const modelsResponseSchema = z.object({
  models: z.array(
    z.object({
      name: z.string(),
    }),
  ),
});

export class OllamaApiClient {
  private readonly baseUrl: string;

  constructor(private readonly config: OllamaAdapterConfig) {
    this.baseUrl = config.baseUrl?.replace(/\/$/, "") ?? DEFAULT_BASE_URL;
  }

  async chatCompletion(
    messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  ): Promise<OllamaApiResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs ?? 120000);

    const payload: Record<string, unknown> = {
      model: this.config.model,
      messages,
      stream: false,
      options: {
        temperature: this.config.temperature ?? 0.7,
        num_predict: this.config.maxTokens ?? 8192,
      },
    };

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Ollama API ${response.status}: ${body}`);
    }

    const parsed = responseSchema.parse(await response.json());
    const usage: OllamaUsage = {
      promptTokens: parsed.prompt_eval_count ?? 0,
      completionTokens: parsed.eval_count ?? 0,
      totalTokens: (parsed.prompt_eval_count ?? 0) + (parsed.eval_count ?? 0),
    };

    return {
      content: parsed.message.content,
      usage,
    };
  }

  async listModels(): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/api/tags`, {
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Ollama API ${response.status}: failed to list models`);
    }

    const parsed = modelsResponseSchema.parse(await response.json());
    return parsed.models.map((m) => m.name);
  }

  async testConnection(): Promise<{ ok: boolean; error?: string; models?: string[] }> {
    try {
      const models = await this.listModels();
      return { ok: true, models };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
}
