import path from "node:path";
import crypto from "node:crypto";
import { JsonFileStore } from "./db";
import type { BreachCheckReport, BreachHistoryRecord, BreachHistorySummary } from "../types";

const store = new JsonFileStore<BreachHistoryRecord[]>(
  path.join(__dirname, "..", "..", "data", "breach-reports.json"),
  []
);

function summarize(record: BreachHistoryRecord): BreachHistorySummary {
  const { report, actionPlan, ...summary } = record;
  return summary;
}

/** Masks an email for display, e.g. "jordan@example.com" -> "j***@example.com". Never the full address is stored. */
function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const visible = local.slice(0, 1);
  return `${visible}${"*".repeat(Math.max(local.length - 1, 3))}@${domain}`;
}

export async function saveBreachReportForUser(
  userId: string,
  email: string,
  report: BreachCheckReport
): Promise<BreachHistoryRecord> {
  const record: BreachHistoryRecord = {
    id: crypto.randomUUID(),
    userId,
    checkedAt: report.checkedAt,
    maskedEmail: maskEmail(email),
    breachCount: report.breaches.length,
    riskLevel: report.riskScore.level,
    actionPlan: report.actionPlan,
    report,
  };

  const records = await store.read();
  records.push(record);
  await store.write(records);

  return record;
}

export interface ListBreachReportsOptions {
  search?: string;
  sortBy?: "date" | "risk";
  sortDir?: "asc" | "desc";
}

const RISK_ORDER: Record<string, number> = { low: 0, moderate: 1, high: 2, severe: 3 };

export async function listBreachReportsForUser(
  userId: string,
  options: ListBreachReportsOptions = {}
): Promise<BreachHistorySummary[]> {
  const { search, sortBy = "date", sortDir = "desc" } = options;

  const records = await store.read();
  let userRecords = records.filter((record) => record.userId === userId);

  if (search) {
    const term = search.toLowerCase();
    userRecords = userRecords.filter((record) => record.maskedEmail.toLowerCase().includes(term));
  }

  userRecords.sort((a, b) => {
    const diff =
      sortBy === "risk"
        ? RISK_ORDER[a.riskLevel] - RISK_ORDER[b.riskLevel]
        : new Date(a.checkedAt).getTime() - new Date(b.checkedAt).getTime();
    return sortDir === "asc" ? diff : -diff;
  });

  return userRecords.map(summarize);
}

export async function getBreachReportForUser(userId: string, reportId: string): Promise<BreachHistoryRecord | undefined> {
  const records = await store.read();
  return records.find((record) => record.id === reportId && record.userId === userId);
}

export async function deleteBreachReportForUser(userId: string, reportId: string): Promise<boolean> {
  const records = await store.read();
  const index = records.findIndex((record) => record.id === reportId && record.userId === userId);
  if (index === -1) return false;

  records.splice(index, 1);
  await store.write(records);
  return true;
}

/** Toggles one action-plan item's completed state and returns the updated plan, or undefined if not found/not owned. */
export async function toggleActionItemForUser(
  userId: string,
  reportId: string,
  actionId: string
): Promise<BreachHistoryRecord["actionPlan"] | undefined> {
  const records = await store.read();
  const record = records.find((r) => r.id === reportId && r.userId === userId);
  if (!record) return undefined;

  const action = record.actionPlan.find((a) => a.id === actionId);
  if (!action) return undefined;

  action.completed = !action.completed;
  record.report.actionPlan = record.actionPlan;
  await store.write(records);

  return record.actionPlan;
}
