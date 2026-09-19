import path from "node:path";
import { JsonFileStore } from "./db";
import type { ActionStatusRecord, ActionStatus } from "../types";

const store = new JsonFileStore<ActionStatusRecord[]>(path.join(__dirname, "..", "..", "data", "action-status.json"), []);

export async function setActionStatus(userId: string, actionKey: string, status: ActionStatus): Promise<void> {
  const records = await store.read();
  const index = records.findIndex((r) => r.userId === userId && r.actionKey === actionKey);
  const updated: ActionStatusRecord = { userId, actionKey, status, updatedAt: new Date().toISOString() };

  if (index >= 0) {
    records[index] = updated;
  } else {
    records.push(updated);
  }

  await store.write(records);
}

/** Returns a lookup map for one user's statuses — actions default to "not-started" if no record exists yet. */
export async function getActionStatusMap(userId: string): Promise<Map<string, ActionStatus>> {
  const records = await store.read();
  const map = new Map<string, ActionStatus>();
  for (const record of records) {
    if (record.userId === userId) map.set(record.actionKey, record.status);
  }
  return map;
}

export async function countCompletedForUser(userId: string): Promise<number> {
  const records = await store.read();
  return records.filter((r) => r.userId === userId && r.status === "completed").length;
}

export async function countDismissedForUser(userId: string): Promise<number> {
  const records = await store.read();
  return records.filter((r) => r.userId === userId && r.status === "dismissed").length;
}
