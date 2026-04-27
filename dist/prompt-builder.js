export function buildPrompt(ctx, config) {
    const { agent, context, runId } = ctx;
    const system = [];
    system.push(`You are ${agent.name}, ${agent.role ?? "AI employee"}.`);
    if (agent.description) {
        system.push(`Role details: ${agent.description}`);
    }
    if (context.company?.name) {
        system.push(`Company: ${context.company.name}`);
    }
    if (context.company?.mission) {
        system.push(`Mission: ${context.company.mission}`);
    }
    if (context.project?.goals?.length) {
        system.push(`Project goals:\n${context.project.goals.map((v, i) => `${i + 1}. ${v}`).join("\n")}`);
    }
    if (context.goal?.title) {
        system.push(`Current goal: ${context.goal.title}`);
        if (context.goal.description) {
            system.push(context.goal.description);
        }
    }
    if (context.parentTasks?.length) {
        system.push(`Parent tasks:\n${context.parentTasks.map((x) => `- ${x.title}`).join("\n")}`);
    }
    if (context.skills?.length) {
        system.push(`Available skills:\n${context.skills.map((x) => `- ${x.name}${x.description ? `: ${x.description}` : ""}`).join("\n")}`);
    }
    if (config.customSystemPrompt) {
        system.push(`Additional instructions: ${config.customSystemPrompt}`);
    }
    const user = [];
    user.push(`Run ID: ${runId}`);
    user.push(`Wake reason: ${context.wakeReason ?? "scheduled heartbeat"}`);
    if (context.taskId) {
        user.push(`Task ID: ${context.taskId}`);
    }
    if (context.taskDescription) {
        user.push(`Task:\n${context.taskDescription}`);
    }
    if (context.taskComments?.length) {
        user.push(`Recent comments:\n${context.taskComments.map((x) => `- ${x.author ?? "unknown"}: ${x.body}`).join("\n")}`);
    }
    if (context.previousRuns?.[0]?.summary) {
        user.push(`Previous run summary:\n${context.previousRuns[0].summary}`);
    }
    return {
        system: system.join("\n\n"),
        user: user.join("\n\n"),
    };
}
//# sourceMappingURL=prompt-builder.js.map