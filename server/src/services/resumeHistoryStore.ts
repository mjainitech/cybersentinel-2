import path from "node:path";
import crypto from "node:crypto";
import { JsonFileStore } from "./db";
import { PRIVACY_RATING_LABELS } from "../utils/privacyScore";
import type { ResumePrivacyReport, ResumeReportRecord, ResumeReportSummary } from "../types";

const store = new JsonFileStore<ResumeReportRecord[]>(
  path.join(__dirname, "..", "..", "data", "resume-reports.json"),
  []
);

function summarize(record: ResumeReportRecord): ResumeReportSummary {
  const { report, ...summary } = record;
  return summary;
}

function buildSummaryText(report: ResumePrivacyReport): string {
  const count = report.detected.length;
  const itemWord = count === 1 ? "item" : "items";
  return `${count} ${itemWord} detected · ${PRIVACY_RATING_LABELS[report.privacyRating]}`;
}

/** Saves a completed resume analysis to a user's history. Only called for signed-in users. */
export async function saveResumeReportForUser(
  userId: string,
  report: ResumePrivacyReport
): Promise<ResumeReportRecord> {
  const record: ResumeReportRecord = {
    id: crypto.randomUUID(),
    userId,
    fileName: report.fileName,
    analyzedAt: report.analyzedAt,
    privacyScore: report.privacyScore,
    privacyRating: report.privacyRating,
    summary: buildSummaryText(report),
    report,
  };

  const records = await store.read();
  records.push(record);
  await store.write(records);

  return record;
}

export interface ListResumeReportsOptions {
  search?: string;
  sortBy?: "date" | "score";
  sortDir?: "asc" | "desc";
}

export async function listResumeReportsForUser(
  userId: string,
  options: ListResumeReportsOptions = {}
): Promise<ResumeReportSummary[]> {
  const { search, sortBy = "date", sortDir = "desc" } = options;

  const records = await store.read();
  let userRecords = records.filter((record) => record.userId === userId);

  if (search) {
    const term = search.toLowerCase();
    userRecords = userRecords.filter((record) => record.fileName.toLowerCase().includes(term));
  }

  userRecords.sort((a, b) => {
    const diff =
      sortBy === "score"
        ? a.privacyScore - b.privacyScore
        : new Date(a.analyzedAt).getTime() - new Date(b.analyzedAt).getTime();
    return sortDir === "asc" ? diff : -diff;
  });

  return userRecords.map(summarize);
}

export async function getResumeReportForUser(
  userId: string,
  reportId: string
): Promise<ResumeReportRecord | undefined> {
  const records = await store.read();
  return records.find((record) => record.id === reportId && record.userId === userId);
}

export async function deleteResumeReportForUser(userId: string, reportId: string): Promise<boolean> {
  const records = await store.read();
  const index = records.findIndex((record) => record.id === reportId && record.userId === userId);
  if (index === -1) return false;

  records.splice(index, 1);
  await store.write(records);
  return true;
}
