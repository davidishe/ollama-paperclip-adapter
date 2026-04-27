export interface TranscriptEntry {
    type: "log" | "status";
    message?: string;
    stream?: "stdout" | "stderr";
    status?: "running" | "success" | "error";
    timestamp: string;
}
export declare const type: "ollama_local";
export declare function parseTranscript(output: string): TranscriptEntry[];
//# sourceMappingURL=client.d.ts.map