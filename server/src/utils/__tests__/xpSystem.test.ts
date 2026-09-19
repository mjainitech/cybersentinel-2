import { describe, it, expect } from "vitest";
import { calculateLevel, LEARNING_LEVELS } from "../xpSystem";

describe("calculateLevel", () => {
  it("starts at level 1 with 0 XP", () => {
    const result = calculateLevel(0);
    expect(result.level).toBe(1);
    expect(result.levelTitle).toBe("Cybersecurity Beginner");
  });

  it("advances to the correct level at each threshold", () => {
    expect(calculateLevel(150).level).toBe(2);
    expect(calculateLevel(400).level).toBe(3);
    expect(calculateLevel(800).level).toBe(4);
    expect(calculateLevel(1400).level).toBe(5);
  });

  it("does not advance a level one XP point below its threshold", () => {
    expect(calculateLevel(149).level).toBe(1);
    expect(calculateLevel(399).level).toBe(2);
  });

  it("reports null xpForNextLevel at the max level", () => {
    const result = calculateLevel(5000);
    expect(result.level).toBe(5);
    expect(result.xpForNextLevel).toBeNull();
    expect(result.xpNeededForNextLevel).toBeNull();
  });

  it("computes xpIntoCurrentLevel and xpNeededForNextLevel correctly mid-level", () => {
    const result = calculateLevel(200); // Level 2 starts at 150, level 3 at 400.
    expect(result.level).toBe(2);
    expect(result.xpIntoCurrentLevel).toBe(50);
    expect(result.xpNeededForNextLevel).toBe(250);
  });

  it("never represents levels as anything but CyberSentinel's own titles", () => {
    for (const level of LEARNING_LEVELS) {
      expect(level.title).not.toMatch(/certifi|CISSP|CompTIA/i);
    }
  });
});
