import { describe, it, expect } from "vitest";
import { parseTranscript } from "../client.js";
describe("parseTranscript", () => {
    it("returns empty array for empty string", () => {
        expect(parseTranscript("")).toEqual([]);
    });
    it("marks completed line as success status", () => {
        const entries = parseTranscript("[ollama] Completed. Tokens: 120 (prompt: 80, completion: 40)\n");
        expect(entries).toHaveLength(1);
        expect(entries[0].type).toBe("status");
        expect(entries[0].status).toBe("success");
    });
    it("marks error line as error status", () => {
        const entries = parseTranscript("[ollama] API error: connection refused\n");
        expect(entries).toHaveLength(1);
        expect(entries[0].type).toBe("status");
        expect(entries[0].status).toBe("error");
    });
    it("classifies ollama log lines as stdout", () => {
        const entries = parseTranscript("[ollama] Starting run abc for agent \"Foo\"\n");
        expect(entries[0].stream).toBe("stdout");
    });
    it("handles multiple lines", () => {
        const output = [
            '[ollama] Starting run run-1 for agent "TestBot"',
            "[ollama] Model: llama3.2 @ http://localhost:11434",
            "[ollama] Completed. Tokens: 200 (prompt: 150, completion: 50)",
        ].join("\n");
        const entries = parseTranscript(output);
        expect(entries).toHaveLength(3);
        expect(entries[2].status).toBe("success");
    });
});
//# sourceMappingURL=client.test.js.map