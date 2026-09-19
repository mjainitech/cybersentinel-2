import { describe, it, expect } from "vitest";
import { validateEmail } from "../validateEmail";

describe("validateEmail", () => {
  it("rejects empty input", () => {
    expect(validateEmail("").valid).toBe(false);
  });

  it("rejects whitespace-only input", () => {
    expect(validateEmail("   ").valid).toBe(false);
  });

  it("accepts a normal email and lowercases it", () => {
    const result = validateEmail("Jordan@Example.COM");
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.email).toBe("jordan@example.com");
  });

  it("trims surrounding whitespace", () => {
    const result = validateEmail("  jordan@example.com  ");
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.email).toBe("jordan@example.com");
  });

  it("rejects a string with no @ symbol", () => {
    expect(validateEmail("not-an-email").valid).toBe(false);
  });

  it("rejects a string with no domain TLD", () => {
    expect(validateEmail("jordan@localhost").valid).toBe(false);
  });

  it("rejects an absurdly long input", () => {
    expect(validateEmail(`${"a".repeat(300)}@example.com`).valid).toBe(false);
  });

  it("gives a friendly, non-technical error message", () => {
    const result = validateEmail("nope");
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).not.toMatch(/regex|pattern|stack/i);
    }
  });
});
