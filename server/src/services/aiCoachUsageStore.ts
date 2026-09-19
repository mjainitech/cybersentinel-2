import path from "node:path";
import { JsonFileStore } from "./db";
import type { AiCoachUsageStats } from "../types";

interface UsageRecord extends AiCoachUsageStats {
  userId: string;
}

const store = new JsonFileStore<UsageRecord[]>(path.join(__dirname, "..", "..", "data", "ai-coach-usage.json"), []);

const EMPTY_STATS: AiCoachUsageStats = { conversationsStarted: 0, questionsAsked: 0, lessonsOpened: 0, toolsOpened: 0 };

async function increment(userId: string, field: keyof AiCoachUsageStats): Promise<void> {
  const records = await store.read();
  let record = records.find((r) => r.userId === userId);

  if (!record) {
    record = { userId, ...EMPTY_STATS };
    records.push(record);
  }

  record[field] += 1;
  await store.write(records);
}

export const recordConversationStarted = (userId: string) => increment(userId, "conversationsStarted");
export const recordQuestionAsked = (userId: string) => increment(userId, "questionsAsked");
export const recordLessonOpened = (userId: string) => increment(userId, "lessonsOpened");
export const recordToolOpened = (userId: string) => increment(userId, "toolsOpened");

export async function getUsageStats(userId: string): Promise<AiCoachUsageStats> {
  const records = await store.read();
  const record = records.find((r) => r.userId === userId);
  return record
    ? { conversationsStarted: record.conversationsStarted, questionsAsked: record.questionsAsked, lessonsOpened: record.lessonsOpened, toolsOpened: record.toolsOpened }
    : EMPTY_STATS;
}
