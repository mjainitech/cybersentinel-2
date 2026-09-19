import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { env } from "../../config/env";
import { lookupBreaches } from "../breachApiClient";

describe("lookupBreaches", () => {
  const originalKey = env.HIBP_API_KEY;
  const originalFetch = global.fetch;

  beforeEach(() => {
    env.HIBP_API_KEY = "test-key";
  });

  afterEach(() => {
    env.HIBP_API_KEY = originalKey;
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("reports not-configured when no API key is set, without calling fetch", async () => {
    env.HIBP_API_KEY = undefined;
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy as unknown as typeof fetch;

    const result = await lookupBreaches("test@example.com");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe("not-configured");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("treats a 404 as a valid 'no breaches found' result, not an error", async () => {
    global.fetch = vi.fn().mockResolvedValue({ status: 404, ok: false }) as unknown as typeof fetch;

    const result = await lookupBreaches("test@example.com");

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.breaches).toEqual([]);
  });

  it("reports rate-limited on a 429 response", async () => {
    global.fetch = vi.fn().mockResolvedValue({ status: 429, ok: false }) as unknown as typeof fetch;

    const result = await lookupBreaches("test@example.com");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe("rate-limited");
  });

  it("reports unavailable when the API throws (network error)", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("network down")) as unknown as typeof fetch;

    const result = await lookupBreaches("test@example.com");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe("unavailable");
  });

  it("parses a successful response into BreachRecord objects", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => [
        {
          Name: "ExampleBreach",
          Title: "Example Breach",
          Domain: "example.com",
          BreachDate: "2021-01-01",
          AddedDate: "2021-02-01",
          DataClasses: ["Email addresses", "Passwords"],
          IsSensitive: false,
          IsVerified: true,
        },
      ],
    }) as unknown as typeof fetch;

    const result = await lookupBreaches("test@example.com");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.breaches).toHaveLength(1);
      expect(result.breaches[0].isPasswordExposed).toBe(true);
      expect(result.breaches[0].exposedCategories).toContain("email");
      expect(result.breaches[0].exposedCategories).toContain("password");
    }
  });
});
