export function normalizeModelName(value: string): string {
  const trimmed = value.trim();
  return trimmed.replace(/:latest$/, "");
}

export function pickModel(
  configuredModel: string | undefined,
  availableModels: string[],
): { model: string | null; source: "config" | "available" | "none" } {
  const normalizedConfig = configuredModel ? normalizeModelName(configuredModel) : "";
  if (normalizedConfig) {
    return { model: normalizedConfig, source: "config" };
  }

  const firstAvailable = availableModels[0];
  if (!firstAvailable) {
    return { model: null, source: "none" };
  }

  return { model: normalizeModelName(firstAvailable), source: "available" };
}
