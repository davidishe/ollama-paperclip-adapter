export { createServerAdapter, models, agentConfigurationDoc } from "./server.js";
export type { OllamaAdapterConfig, OllamaSessionState, OllamaUsage } from "./types.js";

export const ADAPTER_TYPE = "ollama_local";
export const ADAPTER_VERSION = "0.1.0";
