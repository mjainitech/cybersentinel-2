import path from "node:path";
import crypto from "node:crypto";
import { JsonFileStore } from "./db";
import type { SecurityScoreSnapshot, SecurityCategoryResult } from "../types";

const store = new JsonFileStore<SecurityScoreSnapshot[]>(
  path.join(__dirname, "..", "..", "data", "security-score-snapshots.json"),
  []
);

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Records a snapshot of a freshly-computed Security Center profile.
 * At most one per user per day — calling this again the same day
 * updates that day's snapshot in place rather than creating a
 * duplicate, so a user opening the Security Center five times in one
 * day doesn't inflate the trend with five identical points.
 */
export async function recordScoreSnapshot(
  userId: string,
  overallScore: number | null,
  grade: SecurityScoreSnapshot["grade"],
  categories: SecurityCategoryResult[]
): Promise<void> {
  const records = await store.read();
  const today = todayKey();

  const categoryScores: SecurityScoreSnapshot["categoryScores"] = {};
  for (const category of categories) {
    categoryScores[category.id] = category.hasData ? category.score : null;
  }

  const existingIndex = records.findIndex((r) => r.userId === userId && r.date === today);
  const snapshot: SecurityScoreSnapshot = {
    id: existingIndex >= 0 ? records[existingIndex].id : crypto.randomUUID(),
    userId,
    date: today,
    overallScore,
    grade,
    categoryScores,
  };

  if (existingIndex >= 0) {
    records[existingIndex] = snapshot;
  } else {
    records.push(snapshot);
  }

  await store.write(records);
}

export async function listSnapshotsForUser(userId: string, since?: Date): Promise<SecurityScoreSnapshot[]> {
  const records = await store.read();
  const userRecords = records.filter((r) => r.userId === userId);
  const filtered = since ? userRecords.filter((r) => new Date(r.date).getTime() >= since.getTime()) : userRecords;
  return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
