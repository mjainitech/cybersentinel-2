import path from "node:path";
import crypto from "node:crypto";
import { JsonFileStore } from "./db";
import type { ThreatBookmarkRecord } from "../types";

const store = new JsonFileStore<ThreatBookmarkRecord[]>(
  path.join(__dirname, "..", "..", "data", "threat-bookmarks.json"),
  []
);

export async function addBookmark(
  userId: string,
  input: Omit<ThreatBookmarkRecord, "id" | "userId" | "bookmarkedAt">
): Promise<ThreatBookmarkRecord> {
  const records = await store.read();

  const existing = records.find((r) => r.userId === userId && r.threatId === input.threatId && r.threatKind === input.threatKind);
  if (existing) return existing;

  const record: ThreatBookmarkRecord = { id: crypto.randomUUID(), userId, bookmarkedAt: new Date().toISOString(), ...input };
  records.push(record);
  await store.write(records);
  return record;
}

export async function removeBookmark(userId: string, threatId: string, threatKind: "curated" | "cve"): Promise<boolean> {
  const records = await store.read();
  const index = records.findIndex((r) => r.userId === userId && r.threatId === threatId && r.threatKind === threatKind);
  if (index === -1) return false;

  records.splice(index, 1);
  await store.write(records);
  return true;
}

export async function listBookmarksForUser(userId: string): Promise<ThreatBookmarkRecord[]> {
  const records = await store.read();
  return records.filter((r) => r.userId === userId).sort((a, b) => new Date(b.bookmarkedAt).getTime() - new Date(a.bookmarkedAt).getTime());
}

export async function isBookmarked(userId: string, threatId: string, threatKind: "curated" | "cve"): Promise<boolean> {
  const records = await store.read();
  return records.some((r) => r.userId === userId && r.threatId === threatId && r.threatKind === threatKind);
}

export async function countBookmarksForUser(userId: string): Promise<number> {
  const records = await store.read();
  return records.filter((r) => r.userId === userId).length;
}
