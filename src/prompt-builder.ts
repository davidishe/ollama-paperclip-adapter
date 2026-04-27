import type { AdapterExecutionContext } from "@paperclipai/adapter-utils";
import type { OllamaAdapterConfig } from "./types.js";

export interface BuiltPrompt {
  system: string;
  user: string;
}

export function buildPrompt(ctx: AdapterExecutionContext, config: OllamaAdapterConfig): BuiltPrompt {
  const { agent, context, runId } = ctx;
  const system: string[] = [];

  const agentConfig = ctx.config as Record<string, unknown>;

  system.push(`You are ${agent.name}, an AI employee.`);

  const company = context as Record<string, unknown>;
  if (typeof company["companyName"] === "string") {
    system.push(`Company: ${company["companyName"]}`);
  }
  if (typeof company["goalTitle"] === "string") {
    system.push(`Current goal: ${company["goalTitle"]}`);
  }
  if (typeof company["taskDescription"] === "string") {
    system.push(`Task context: ${company["taskDescription"]}`);
  }
  if (config.customSystemPrompt) {
    system.push(`Additional instructions: ${config.customSystemPrompt}`);
  }

  const user: string[] = [];
  user.push(`Run ID: ${runId}`);

  if (typeof company["wakeReason"] === "string") {
    user.push(`Wake reason: ${company["wakeReason"]}`);
  }
  if (typeof company["taskId"] === "string") {
    user.push(`Task ID: ${company["taskId"]}`);
  }
  if (typeof company["taskTitle"] === "string") {
    user.push(`Task: ${company["taskTitle"]}`);
  }
  if (typeof company["taskDescription"] === "string") {
    user.push(`Description:\n${company["taskDescription"]}`);
  }
  if (typeof company["promptText"] === "string") {
    user.push(company["promptText"]);
  }

  return {
    system: system.join("\n\n"),
    user: user.join("\n\n"),
  };
}
