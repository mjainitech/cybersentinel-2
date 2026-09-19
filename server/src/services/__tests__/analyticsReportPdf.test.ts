import { describe, it, expect } from "vitest";
import { generateSecurityReportPdf } from "../analyticsReportPdf";
import type { SecurityReportData } from "../../types";

function makeReport(overrides: Partial<SecurityReportData> = {}): SecurityReportData {
  return {
    generatedAt: new Date().toISOString(),
    timeRangeLabel: "Last 30 Days",
    overallScore: 82,
    grade: "B",
    categories: [
      {
        id: "password-security",
        title: "Password Security",
        hasData: true,
        score: 80,
        status: "good",
        explanation: "test",
        recommendedAction: "test",
        stats: {},
      },
    ],
    majorFindings: ["Example finding."],
    recommendations: [{ id: "r1", text: "Review password security", reason: "test reason", priority: "high", category: "password-security" }],
    learning: {
      lessonsCompleted: 2,
      quizCompletionRate: 50,
      averageQuizScore: 90,
      xpEarned: 40,
      currentLevel: 1,
      levelTitle: "Cybersecurity Beginner",
      currentStreak: 1,
      categoriesCompleted: 0,
      totalCategories: 7,
    },
    threatIntel: { threatsViewed: 3, threatsBookmarked: 1, mostViewedCategories: [] },
    summary: "Test summary.",
    ...overrides,
  };
}

describe("generateSecurityReportPdf", () => {
  it("produces a non-empty PDF buffer without throwing", async () => {
    const buffer = await generateSecurityReportPdf(makeReport());
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
    // A real PDF always starts with this magic header.
    expect(buffer.subarray(0, 4).toString()).toBe("%PDF");
  });

  it("handles a report with no score yet (new user) without crashing", async () => {
    const buffer = await generateSecurityReportPdf(makeReport({ overallScore: null, grade: null, categories: [], majorFindings: [], recommendations: [] }));
    expect(buffer.length).toBeGreaterThan(0);
  });

  it("never includes a literal password, credential, or leaked-data field in the report data going in", () => {
    const report = makeReport();
    const serialized = JSON.stringify(report).toLowerCase();
    expect(serialized).not.toContain("password\":");
    expect(serialized).not.toContain("credential");
    expect(serialized).not.toContain("leaked");
  });
});
