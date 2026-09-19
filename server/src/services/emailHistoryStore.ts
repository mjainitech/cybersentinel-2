import path from "node:path";
import crypto from "node:crypto";
import { JsonFileStore } from "./db";
import { EMAIL_CLASSIFICATION_LABELS } from "../utils/emailRiskScore";
import type { EmailAnalysisReport, EmailHistoryRecord, EmailHistorySummary } from "../types";

const store = new JsonFileStore<EmailHistoryRecord[]>(
  path.join(__dirname, "..", "..", "data", "email-reports.json"),
  []
);

function summarize(record: EmailHistoryRecord): EmailHistorySummary {
  const { report, ...summary } = record;
  return summary;
}

function buildSummaryText(report: EmailAnalysisReport): string {
  const count = report.indicators.length;
  const itemWord = count === 1 ? "indicator" : "indicators";
  return `${count} ${itemWord} · ${EMAIL_CLASSIFICATION_LABELS[report.classification]}`;
}

export async function saveEmailReportForUser(userId: string, report: EmailAnalysisReport): Promise<EmailHistoryRecord> {
  const record: EmailHistoryRecord = {
    id: crypto.randomUUID(),
    userId,
    analyzedAt: report.analyzedAt,
    riskScore: report.riskScore,
    classification: report.classification,
    summary: buildSummaryText(report),
    report,
  };

  const records = await store.read();
  records.push(record);
  await store.write(records);

  return record;
}

export interface ListEmailReportsOptions {
  search?: string;
  sortBy?: "date" | "score";
  sortDir?: "asc" | "desc";
}

export async function listEmailReportsForUser(
  userId: string,
  options: ListEmailReportsOptions = {}
): Promise<EmailHistorySummary[]> {
  const { search, sortBy = "date", sortDir = "desc" } = options;

  const records = await store.read();
  let userRecords = records.filter((record) => record.userId === userId);

  if (search) {
    const term = search.toLowerCase();
    userRecords = userRecords.filter((record) => record.summary.toLowerCase().includes(term));
  }

  userRecords.sort((a, b) => {
    const diff =
      sortBy === "score" ? a.riskScore - b.riskScore : new Date(a.analyzedAt).getTime() - new Date(b.analyzedAt).getTime();
    return sortDir === "asc" ? diff : -diff;
  });

  return userRecords.map(summarize);
}

export async function getEmailReportForUser(userId: string, reportId: string): Promise<EmailHistoryRecord | undefined> {
  const records = await store.read();
  return records.find((record) => record.id === reportId && record.userId === userId);
}

export async function deleteEmailReportForUser(userId: string, reportId: string): Promise<boolean> {
  const records = await store.read();
  const index = records.findIndex((record) => record.id === reportId && record.userId === userId);
  if (index === -1) return false;

  records.splice(index, 1);
  await store.write(records);
  return true;
}
