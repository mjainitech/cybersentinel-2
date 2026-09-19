import { describe, it, expect, vi, afterEach } from "vitest";
import { getCveById, getRecentCves } from "../nvdApiClient";

function mockNvdResponse(vulnerabilities: unknown[], totalResults = vulnerabilities.length) {
  return {
    status: 200,
    ok: true,
    json: async () => ({ totalResults, vulnerabilities }),
  };
}

describe("nvdApiClient", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("parses a well-formed CVE record correctly", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      mockNvdResponse([
        {
          cve: {
            id: "CVE-2024-12345",
            published: "2024-01-01T00:00:00.000",
            lastModified: "2024-02-01T00:00:00.000",
            descriptions: [{ lang: "en", value: "A remote code execution vulnerability." }],
            references: [{ url: "https://example.com/advisory" }],
            metrics: { cvssMetricV31: [{ cvssData: { baseScore: 9.8, baseSeverity: "CRITICAL" } }] },
            configurations: [
              { nodes: [{ cpeMatch: [{ criteria: "cpe:2.3:a:apache:log4j:2.14.1:*:*:*:*:*:*:*" }] }] },
            ],
          },
        },
      ])
    ) as unknown as typeof fetch;

    const result = await getCveById("CVE-2024-12345");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.records).toHaveLength(1);
      expect(result.records[0].id).toBe("CVE-2024-12345");
      expect(result.records[0].severity).toBe("critical");
      expect(result.records[0].cvssScore).toBe(9.8);
      expect(result.records[0].affectedProducts).toContain("apache log4j");
    }
  });

  it("skips a malformed record (missing id) rather than crashing or showing broken data", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      mockNvdResponse([
        { cve: { id: "", descriptions: [] } },
        {
          cve: {
            id: "CVE-2024-99999",
            descriptions: [{ lang: "en", value: "Valid entry." }],
          },
        },
      ])
    ) as unknown as typeof fetch;

    const result = await getRecentCves();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.records).toHaveLength(1);
      expect(result.records[0].id).toBe("CVE-2024-99999");
    }
  });

  it("falls back to 'No description available.' when descriptions are missing", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      mockNvdResponse([{ cve: { id: "CVE-2024-00001" } }])
    ) as unknown as typeof fetch;

    const result = await getRecentCves();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.records[0].description).toBe("No description available.");
    }
  });

  it("reports 'unavailable' on a network failure", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("network down")) as unknown as typeof fetch;

    const result = await getCveById("CVE-2024-00002");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe("unavailable");
  });

  it("reports 'rate-limited' on a 429 response", async () => {
    global.fetch = vi.fn().mockResolvedValue({ status: 429, ok: false }) as unknown as typeof fetch;

    const result = await getCveById("CVE-2024-00003");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe("rate-limited");
  });

  it("reports 'not-found' on a 404 response", async () => {
    global.fetch = vi.fn().mockResolvedValue({ status: 404, ok: false }) as unknown as typeof fetch;

    const result = await getCveById("CVE-2099-00000");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe("not-found");
  });

  it("falls back to a constructed NVD URL when no reference is provided", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      mockNvdResponse([{ cve: { id: "CVE-2024-00004", descriptions: [{ lang: "en", value: "x" }] } }])
    ) as unknown as typeof fetch;

    const result = await getRecentCves();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.records[0].referenceUrl).toBe("https://nvd.nist.gov/vuln/detail/CVE-2024-00004");
    }
  });
});
