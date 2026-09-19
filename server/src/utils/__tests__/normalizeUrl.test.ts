import { describe, it, expect } from "vitest";
import { normalizeUrl } from "../normalizeUrl";

describe("normalizeUrl", () => {
  it("rejects empty input", () => {
    const result = normalizeUrl("");
    expect(result.valid).toBe(false);
  });

  it("rejects non-string input", () => {
    const result = normalizeUrl(undefined);
    expect(result.valid).toBe(false);
  });

  it("adds https:// when no protocol is given", () => {
    const result = normalizeUrl("example.com");
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.url).toBe("https://example.com/");
      expect(result.hostname).toBe("example.com");
    }
  });

  it("preserves an explicit http:// protocol", () => {
    const result = normalizeUrl("http://example.com");
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.url.startsWith("http://")).toBe(true);
  });

  it("rejects a string that isn't a plausible domain", () => {
    const result = normalizeUrl("not a url at all");
    expect(result.valid).toBe(false);
  });

  it("rejects a bare word with no TLD", () => {
    const result = normalizeUrl("localhost");
    expect(result.valid).toBe(false);
  });
});
