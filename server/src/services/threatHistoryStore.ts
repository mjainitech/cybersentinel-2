import path from "node:path";
import crypto from "node:crypto";
import { JsonFileStore } from "./db";
import type { ThreatHistoryRecord } from "../types";

const store = new JsonFileStore<ThreatHistoryRecord[]>(
  path.join(__dirname, "..", "..", "data", "threat-history.json"),
  []
);

/** Only the most recent N entries per user are kept — this is "recently viewed," not a permanent browsing log. */
const MAX_HISTORY_PER_USER = 30;

export async function recordView(
  userId: string,
  input: Omit<ThreatHistoryRecord, "id" | "userId" | "viewedAt">
): Promise<void> {
  const records = await store.read();

  // Remove any prior view of the same item so re-viewing moves it to the top rather than duplicating.
  const withoutDuplicate = records.filter((r) => !(r.userId === userId && r.threatId === input.threatId && r.threatKind === input.threatKind));

  const newRecord: ThreatHistoryRecord = { id: crypto.randomUUID(), userId, viewedAt: new Date().toISOString(), ...input };

  const usersOtherRecords = withoutDuplicate.filter((r) => r.userId !== userId);
  const thisUsersRecords = withoutDuplicate
    .filter((r) => r.userId === userId)
    .sort((a, b) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime());

  const trimmed = [newRecord, ...thisUsersRecords].slice(0, MAX_HISTORY_PER_USER);

  await store.write([...usersOtherRecords, ...trimmed]);
}

export async function listHistoryForUser(userId: string): Promise<ThreatHistoryRecord[]> {
  const records = await store.read();
  return records
    .filter((r) => r.userId === userId)
    .sort((a, b) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime());
}

export async function clearHistoryForUser(userId: string): Promise<void> {
  const records = await store.read();
  await store.write(records.filter((r) => r.userId !== userId));
}

export async function countViewedForUser(userId: string): Promise<number> {
  const records = await store.read();
  return records.filter((r) => r.userId === userId).length;
}
