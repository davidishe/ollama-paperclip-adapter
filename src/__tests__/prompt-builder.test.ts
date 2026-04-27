import { describe, it, expect } from "vitest";
import { buildPrompt } from "../prompt-builder.js";
import type { AdapterExecutionContext } from "@paperclipai/adapter-utils";

function makeCtx(contextOverrides: Record<string, unknown> = {}): AdapterExecutionContext {
  return {
    runId: "run-test-123",
    agent: {
      id: "agent-1",
      companyId: "company-1",
      name: "TestBot",
      adapterType: "ollama_local",
      adapterConfig: { model: "llama3.2" },
    },
    runtime: {
      sessionId: null,
      sessionParams: null,
      sessionDisplayId: null,
      taskKey: null,
    },
    config: { model: "llama3.2" },
    context: {
      wakeReason: "heartbeat",
      taskId: "TASK-1",
      taskDescription: "Do something useful",
      ...contextOverrides,
    },
    onLog: async () => {},
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

  it("includes company name when provided", () => {
    const { system } = buildPrompt(
      makeCtx({ companyName: "Acme Corp" }),
      { model: "llama3.2" },
    );
    expect(system).toContain("Acme Corp");
  });

  it("includes goal title when provided", () => {
    const { system } = buildPrompt(
      makeCtx({ goalTitle: "Grow revenue" }),
      { model: "llama3.2" },
    );
    expect(system).toContain("Grow revenue");
  });
});
