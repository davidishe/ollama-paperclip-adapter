import { describe, expect, it } from "vitest";
import { normalizeModelName, pickModel } from "../model-utils.js";

describe("normalizeModelName", () => {
  it("strips :latest suffix", () => {
    expect(normalizeModelName("llama3.2:latest")).toBe("llama3.2");
  });

  it("trims whitespace", () => {
    expect(normalizeModelName("  mistral  ")).toBe("mistral");
  });
});

describe("pickModel", () => {
  it("prefers configured model", () => {
    expect(pickModel("qwen2.5-coder", ["llama3.2:latest"])).toEqual({
      model: "qwen2.5-coder",
      source: "config",
    });
  });

  it("falls back to first available model", () => {
    expect(pickModel("", ["llama3.2:latest", "mistral"])).toEqual({
      model: "llama3.2",
      source: "available",
    });
  });

  it("returns none when nothing is available", () => {
    expect(pickModel(undefined, [])).toEqual({
      model: null,
      source: "none",
    });
  });
});
