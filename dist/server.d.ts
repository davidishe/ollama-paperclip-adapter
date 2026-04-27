import type { AdapterExecutionContext, AdapterExecutionResult, EnvironmentTestResult } from "./types.js";
export declare const type: "ollama_local";
export declare const models: readonly [{
    readonly id: "llama3.2";
    readonly label: "Llama 3.2";
}, {
    readonly id: "llama3.1";
    readonly label: "Llama 3.1";
}, {
    readonly id: "qwen2.5-coder";
    readonly label: "Qwen 2.5 Coder";
}, {
    readonly id: "qwen2.5";
    readonly label: "Qwen 2.5";
}, {
    readonly id: "mistral";
    readonly label: "Mistral";
}, {
    readonly id: "gemma3";
    readonly label: "Gemma 3";
}, {
    readonly id: "phi4";
    readonly label: "Phi-4";
}, {
    readonly id: "deepseek-r1";
    readonly label: "DeepSeek R1";
}, {
    readonly id: "codellama";
    readonly label: "Code Llama";
}];
export declare const agentConfigurationDoc = "# Ollama Local Adapter Configuration\n\n## Required\n- model: any model name available in your local Ollama instance\n  Examples: llama3.2, qwen2.5-coder, mistral, gemma3, phi4, deepseek-r1\n\n## Optional\n- baseUrl: Ollama server URL (default: http://localhost:11434)\n- maxTokens: max output tokens (default: 8192)\n- temperature: sampling temperature (default: 0.7)\n- timeoutMs: request timeout in ms (default: 120000)\n- customSystemPrompt: append extra instructions to system prompt\n\n## Setup\n1. Install Ollama: https://ollama.com/download\n2. Pull a model: ollama pull llama3.2\n3. Ollama runs automatically on http://localhost:11434\n4. No API key needed \u2014 it runs fully locally.\n\n## Remote Ollama\nSet baseUrl to reach a non-local Ollama instance:\n  baseUrl: http://192.168.1.100:11434\n";
export declare function execute(ctx: AdapterExecutionContext): Promise<AdapterExecutionResult>;
export declare function testEnvironment(ctx: AdapterExecutionContext): Promise<EnvironmentTestResult>;
//# sourceMappingURL=server.d.ts.map