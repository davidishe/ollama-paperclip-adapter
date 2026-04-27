export interface OllamaAdapterConfig {
  /** Ollama base URL, defaults to http://localhost:11434 */
  baseUrl?: string;
  /** Model name as known to Ollama, e.g. "llama3.2", "qwen2.5-coder", "mistral" */
  model: string;
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
  customSystemPrompt?: string;
}

export interface OllamaSessionMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OllamaSessionState {
  schemaVersion: number;
  messageHistory?: OllamaSessionMessage[];
}

export interface OllamaUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface OllamaApiResult {
  content: string;
  usage: OllamaUsage;
}
