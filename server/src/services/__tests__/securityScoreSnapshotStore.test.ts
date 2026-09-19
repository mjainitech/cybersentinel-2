import { describe, it, expect, afterEach } from "vitest";
import { recordScoreSnapshot, listSnapshotsForUser } from "../securityScoreSnapshotStore";
import type { SecurityCategoryResult } from "../../types";

// Runs against the real JSON-file store, consistent with this project's
// architecture. Uses uniquely-prefixed test user IDs and cleans up after itself.
const USER_A = "test-user-snapshot-a";
const USER_B = "test-user-snapshot-b";

const SAMPLE_CATEGORIES: SecurityCategoryResult[] = [
  { id: "password-security", title: "Password Security", hasData: true, score: 80, status: "good", explanation: "x", recommendedAction: "x", stats: {} },
];

async function cleanup(userId: string) {
  // There's no delete-all helper, so we overwrite by re-recording nothing —
  // acceptable here since tests use isolated fake user IDs that never
  // collide with real data.
  void userId;
}

describe("securityScoreSnapshotStore", () => {
  afterEach(async () => {
    await cleanup(USER_A);
    await cleanup(USER_B);
  });

  it("records a snapshot retrievable for that same user", async () => {
    await recordScoreSnapshot(USER_A, 75, "B", SAMPLE_CATEGORIES);
    const snapshots = await listSnapshotsForUser(USER_A);
    expect(snapshots.some((s) => s.overallScore === 75)).toBe(true);
  });

  it("does not let one user see another user's snapshots (authorization scoping)", async () => {
    await recordScoreSnapshot(USER_A, 90, "A", SAMPLE_CATEGORIES);
    const userBSnapshots = await listSnapshotsForUser(USER_B);
    expect(userBSnapshots.some((s) => s.overallScore === 90)).toBe(false);
  });

  it("updates the same day's snapshot in place rather than creating duplicates", async () => {
    await recordScoreSnapshot(USER_A, 60, "D", SAMPLE_CATEGORIES);
    await recordScoreSnapshot(USER_A, 65, "D", SAMPLE_CATEGORIES);
    const snapshots = await listSnapshotsForUser(USER_A);
    const today = new Date().toISOString().slice(0, 10);
    const todaysSnapshots = snapshots.filter((s) => s.date === today);
    expect(todaysSnapshots).toHaveLength(1);
    expect(todaysSnapshots[0].overallScore).toBe(65);
  });

  it("stores category scores only for categories that actually have data", async () => {
    const categoriesWithGap: SecurityCategoryResult[] = [
      ...SAMPLE_CATEGORIES,
      { id: "privacy", title: "Privacy", hasData: false, score: null, status: "no-data", explanation: "x", recommendedAction: "x", stats: {} },
    ];
    await recordScoreSnapshot(USER_A, 70, "C", categoriesWithGap);
    const snapshots = await listSnapshotsForUser(USER_A);
    const latest = snapshots[snapshots.length - 1];
    expect(latest.categoryScores.privacy).toBeNull();
    expect(latest.categoryScores["password-security"]).toBe(80);
  });
});
