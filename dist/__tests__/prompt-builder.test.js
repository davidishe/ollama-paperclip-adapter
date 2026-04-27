import { describe, it, expect } from "vitest";
import { buildPrompt } from "../prompt-builder.js";
function makeCtx(overrides = {}) {
    return {
        runId: "run-test-123",
        agent: { id: "agent-1", name: "TestBot", role: "assistant" },
        config: { model: "llama3.2" },
        context: {
            wakeReason: "heartbeat",
            taskId: "TASK-1",
            taskDescription: "Do something useful",
            ...overrides,
        },
        sessionParams: undefined,
        onLog: async () => { },
    };
}
describe("buildPrompt", () => {
    it("includes agent name in system prompt", () => {
        const { system } = buildPrompt(makeCtx(), { model: "llama3.2" });
        expect(system).toContain("TestBot");
    });
    it("includes task description in user prompt", () => {
        const { user } = buildPrompt(makeCtx(), { model: "llama3.2" });
        expect(user).toContain("Do something useful");
    });
    it("includes run id in user prompt", () => {
        const { user } = buildPrompt(makeCtx(), { model: "llama3.2" });
        expect(user).toContain("run-test-123");
    });
    it("appends customSystemPrompt when provided", () => {
        const { system } = buildPrompt(makeCtx(), { model: "llama3.2", customSystemPrompt: "Extra instruction" });
        expect(system).toContain("Extra instruction");
    });
    it("includes company info when provided", () => {
        const { system } = buildPrompt(makeCtx({ company: { name: "Acme Corp", mission: "Do good things" } }), { model: "llama3.2" });
        expect(system).toContain("Acme Corp");
        expect(system).toContain("Do good things");
    });
    it("includes previous run summary when available", () => {
        const { user } = buildPrompt(makeCtx({ previousRuns: [{ summary: "Last time I fixed a bug" }] }), { model: "llama3.2" });
        expect(user).toContain("Last time I fixed a bug");
    });
});
//# sourceMappingURL=prompt-builder.test.js.map