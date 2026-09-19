import path from "node:path";
import crypto from "node:crypto";
import { JsonFileStore } from "./db";
import type { PasswordChecklistState, PasswordHistoryRecord, PasswordHistorySummary } from "../types";

const store = new JsonFileStore<PasswordHistoryRecord[]>(
  path.join(__dirname, "..", "..", "data", "password-reports.json"),
  []
);

function summarize(record: PasswordHistoryRecord): PasswordHistorySummary {
  const { recommendations, checklist, ...summary } = record;
  return summary;
}

export interface SavePasswordReportInput {
  score: number;
  rating: PasswordHistoryRecord["rating"];
  recommendations: string[];
  checklist: PasswordChecklistState;
}

/**
 * Saves a password *analysis result* — never the password itself. The
 * caller (controllers/passwordController.ts) only ever forwards the
 * numeric score, rating, recommendation text, and checklist booleans
 * that the frontend already computed locally.
 */
export async function savePasswordReportForUser(
  userId: string,
  input: SavePasswordReportInput
): Promise<PasswordHistoryRecord> {
  const completionValues = Object.values(input.checklist);
  const checklistCompletionPercent = Math.round(
    (completionValues.filter(Boolean).length / completionValues.length) * 100
  );

  const record: PasswordHistoryRecord = {
    id: crypto.randomUUID(),
    userId,
    analyzedAt: new Date().toISOString(),
    score: input.score,
    rating: input.rating,
    recommendations: input.recommendations,
    checklist: input.checklist,
    checklistCompletionPercent,
  };

  const records = await store.read();
  records.push(record);
  await store.write(records);

  return record;
}

export interface ListPasswordReportsOptions {
  sortBy?: "date" | "score";
  sortDir?: "asc" | "desc";
}

export async function listPasswordReportsForUser(
  userId: string,
  options: ListPasswordReportsOptions = {}
): Promise<PasswordHistorySummary[]> {
  const { sortBy = "date", sortDir = "desc" } = options;

  const records = await store.read();
  const userRecords = records.filter((record) => record.userId === userId);

  userRecords.sort((a, b) => {
    const diff = sortBy === "score" ? a.score - b.score : new Date(a.analyzedAt).getTime() - new Date(b.analyzedAt).getTime();
    return sortDir === "asc" ? diff : -diff;
  });

  return userRecords.map(summarize);
}

export async function getPasswordReportForUser(userId: string, reportId: string): Promise<PasswordHistoryRecord | undefined> {
  const records = await store.read();
  return records.find((record) => record.id === reportId && record.userId === userId);
}

export async function deletePasswordReportForUser(userId: string, reportId: string): Promise<boolean> {
  const records = await store.read();
  const index = records.findIndex((record) => record.id === reportId && record.userId === userId);
  if (index === -1) return false;

  records.splice(index, 1);
  await store.write(records);
  return true;
}
