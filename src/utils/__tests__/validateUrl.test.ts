import { describe, it, expect } from "vitest";
import { validateUrl } from "../validateUrl";

describe("validateUrl", () => {
  it("rejects empty input with a friendly message", () => {
    const result = validateUrl("");
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error).toMatch(/enter a url/i);
  });

  it("rejects whitespace-only input", () => {
    const result = validateUrl("   ");
    expect(result.valid).toBe(false);
  });

  it("accepts a bare domain and normalizes it to https://", () => {
    const result = validateUrl("example.com");
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.url).toBe("https://example.com/");
  });

  it("preserves an explicit http:// protocol instead of forcing https", () => {
    const result = validateUrl("http://example.com");
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.url.startsWith("http://")).toBe(true);
  });

  it("is case-insensitive about the protocol", () => {
    const result = validateUrl("HTTPS://example.com");
    expect(result.valid).toBe(true);
  });

  it("rejects nonsense input that isn't a plausible domain", () => {
    const result = validateUrl("this is not a url");
    expect(result.valid).toBe(false);
  });

  it("rejects a single word with no top-level domain", () => {
    const result = validateUrl("example");
    expect(result.valid).toBe(false);
  });

  it("trims surrounding whitespace before validating", () => {
    const result = validateUrl("   example.com   ");
    expect(result.valid).toBe(true);
  });
});
