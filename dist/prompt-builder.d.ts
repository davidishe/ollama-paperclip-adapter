import type { AdapterExecutionContext, OllamaAdapterConfig } from "./types.js";
export interface BuiltPrompt {
    system: string;
    user: string;
}
export declare function buildPrompt(ctx: AdapterExecutionContext, config: OllamaAdapterConfig): BuiltPrompt;
//# sourceMappingURL=prompt-builder.d.ts.map