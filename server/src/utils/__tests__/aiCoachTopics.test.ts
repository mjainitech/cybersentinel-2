import { describe, it, expect } from "vitest";
import { detectTopics, getRecommendedLesson, getRecommendedTool } from "../aiCoachTopics";
import { getLessonById } from "../../data/learningContent";

describe("detectTopics", () => {
  it("detects a single clear topic", () => {
    expect(detectTopics("How do I create a strong password?")).toContain("password");
  });

  it("detects multiple topics in one message", () => {
    const topics = detectTopics("Is this phishing email trying to steal my password?");
    expect(topics).toContain("phishing");
    expect(topics).toContain("password");
  });

  it("returns an empty array for a message matching no known topic", () => {
    expect(detectTopics("What's the weather like today?")).toEqual([]);
  });

  it("is case-insensitive", () => {
    expect(detectTopics("PHISHING email")).toContain("phishing");
  });
});

describe("getRecommendedLesson", () => {
  it("only ever recommends a lesson that actually exists and is available", () => {
    const topics = ["password", "phishing", "privacy", "website", "breach", "malware"] as const;
    for (const topic of topics) {
      const lesson = getRecommendedLesson([topic]);
      expect(lesson).toBeDefined();
      const realLesson = getLessonById(lesson!.lessonId);
      expect(realLesson).toBeDefined();
      expect(realLesson?.isAvailable).toBe(true);
    }
  });

  it("returns undefined for topics with no lesson mapping (e.g. threat, analytics)", () => {
    expect(getRecommendedLesson(["threat"])).toBeUndefined();
    expect(getRecommendedLesson(["analytics"])).toBeUndefined();
  });

  it("returns undefined for an empty topic list rather than guessing", () => {
    expect(getRecommendedLesson([])).toBeUndefined();
  });

  it("prefers the first topic with a mapping when multiple topics are present", () => {
    const lesson = getRecommendedLesson(["threat", "password"]);
    expect(lesson?.lessonId).toBe("multi-factor-authentication");
  });
});

describe("getRecommendedTool", () => {
  it("maps every topic to a real, existing CyberSentinel route", () => {
    const topics = ["password", "phishing", "privacy", "website", "breach", "learning", "threat", "analytics"] as const;
    for (const topic of topics) {
      const tool = getRecommendedTool([topic]);
      expect(tool).toBeDefined();
      expect(tool?.href.startsWith("/")).toBe(true);
    }
  });
});
