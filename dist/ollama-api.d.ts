import type { OllamaAdapterConfig, OllamaApiResult } from "./types.js";
export declare class OllamaApiClient {
    private readonly config;
    private readonly baseUrl;
    constructor(config: OllamaAdapterConfig);
    chatCompletion(messages: Array<{
        role: "system" | "user" | "assistant";
        content: string;
    }>): Promise<OllamaApiResult>;
    listModels(): Promise<string[]>;
    testConnection(): Promise<{
        ok: boolean;
        error?: string;
        models?: string[];
    }>;
}
//# sourceMappingURL=ollama-api.d.ts.map