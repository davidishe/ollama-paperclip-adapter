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
export interface AdapterExecutionContext {
    runId: string;
    agent: {
        id: string;
        name: string;
        role?: string;
        description?: string;
    };
    config: unknown;
    context: {
        wakeReason?: string;
        taskId?: string;
        taskDescription?: string;
        taskComments?: Array<{
            author?: string;
            body: string;
        }>;
        company?: {
            name?: string;
            mission?: string;
        };
        project?: {
            goals?: string[];
        };
        goal?: {
            title?: string;
            description?: string;
        };
        parentTasks?: Array<{
            title: string;
        }>;
        skills?: Array<{
            name: string;
            description?: string;
        }>;
        previousRuns?: Array<{
            summary?: string;
        }>;
    };
    sessionParams?: unknown;
    onLog: (stream: "stdout" | "stderr", chunk: string) => Promise<void>;
}
export interface AdapterExecutionResult {
    exitCode: number;
    timedOut: boolean;
    usage: {
        inputTokens: number;
        outputTokens: number;
    };
    provider: "ollama";
    model: string;
    costUsd: number;
    summary: string;
    sessionParams: OllamaSessionState;
}
export interface EnvironmentTestCheck {
    code: string;
    level: "info" | "warning" | "error";
    message: string;
}
export interface EnvironmentTestResult {
    adapterType: "ollama_local";
    status: "pass" | "fail";
    checks: EnvironmentTestCheck[];
    testedAt: string;
}
//# sourceMappingURL=types.d.ts.map