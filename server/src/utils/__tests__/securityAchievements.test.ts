import { describe, it, expect } from "vitest";
import { calculateAchievements } from "../securityAchievements";

const ZERO_COUNTS = {
  websiteScans: 0,
  resumeReports: 0,
  emailReports: 0,
  passwordReports: 0,
  breachChecks: 0,
  lessonsCompleted: 0,
};

describe("calculateAchievements", () => {
  it("locks every achievement with zero activity", () => {
    const achievements = calculateAchievements(ZERO_COUNTS);
    expect(achievements.every((a) => !a.unlocked)).toBe(true);
  });

  it("unlocks 'CyberSentinel Beginner' after a single action of any kind", () => {
    const achievements = calculateAchievements({ ...ZERO_COUNTS, websiteScans: 1 });
    const beginner = achievements.find((a) => a.id === "cybersentinel-beginner");
    expect(beginner?.unlocked).toBe(true);
  });

  it("unlocks the feature-specific achievement only for that feature's activity", () => {
    const achievements = calculateAchievements({ ...ZERO_COUNTS, breachChecks: 1 });
    expect(achievements.find((a) => a.id === "breach-watcher")?.unlocked).toBe(true);
    expect(achievements.find((a) => a.id === "first-website-scan")?.unlocked).toBe(false);
    expect(achievements.find((a) => a.id === "privacy-protector")?.unlocked).toBe(false);
  });

  it("'Security Learner' unlocks once a real lesson has been completed in the Learning Hub", () => {
    const locked = calculateAchievements({ ...ZERO_COUNTS, lessonsCompleted: 0 });
    expect(locked.find((a) => a.id === "security-learner")?.unlocked).toBe(false);

    const unlocked = calculateAchievements({ ...ZERO_COUNTS, lessonsCompleted: 1 });
    expect(unlocked.find((a) => a.id === "security-learner")?.unlocked).toBe(true);
  });

  it("unlocks all feature achievements (including Security Learner) when every feature has activity", () => {
    const achievements = calculateAchievements({
      websiteScans: 1,
      resumeReports: 1,
      emailReports: 1,
      passwordReports: 1,
      breachChecks: 1,
      lessonsCompleted: 1,
    });
    const unlockedCount = achievements.filter((a) => a.unlocked).length;
    // Beginner + 5 feature-specific achievements + Security Learner = 7.
    expect(unlockedCount).toBe(7);
  });
});
