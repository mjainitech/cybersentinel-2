import { authHeader, getAuthToken } from "@/services/authToken";
import type { AiExplanation } from "@/services/scanService";

export type EmailIndicatorCategory =
  | "sender-mismatch"
  | "suspicious-domain"
  | "urgent-language"
  | "credential-request"
  | "payment-request"
  | "threatening-language"
  | "grammar-spelling"
  | "suspicious-link"
  | "suspicious-attachment"
  | "brand-impersonation";

export interface EmailIndicator {
  category: EmailIndicatorCategory;
  label: string;
  explanation: string;
  severity: "low" | "medium" | "high";
  index?: number;
  length?: number;
  matchedText?: string;
}

export type EmailRiskClassification = "likely-safe" | "use-caution" | "suspicious" | "likely-phishing";

export interface ExtractedEmailLink {
  url: string;
  domain: string;
  protocol: string;
  isShortened: boolean;
  isIpAddress: boolean;
  isHttps: boolean;
}

export interface EmailAttachmentInfo {
  filename: string;
  fileType: string;
  fileSize: number;
  riskIndicators: string[];
}

export interface EmailAnalysisReport {
  inputMethod: "text" | "headers" | "screenshot";
  analyzedAt: string;
  riskScore: number;
  classification: EmailRiskClassification;
  indicators: EmailIndicator[];
  links: ExtractedEmailLink[];
  attachment?: EmailAttachmentInfo;
  aiExplanation: AiExplanation;
  analyzedText: string;
  lowTextWarning: boolean;
}

export const EMAIL_CLASSIFICATION_LABELS: Record<EmailRiskClassification, string> = {
  "likely-safe": "Likely Safe",
  "use-caution": "Use Caution",
  suspicious: "Suspicious",
  "likely-phishing": "Likely Phishing",
};

export const EMAIL_ANALYSIS_STAGES = [
  "Reading email content...",
  "Extracting links...",
  "Scanning for phishing indicators...",
  "Generating explanation...",
];

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8787";

export interface AnalyzeEmailInput {
  inputMethod: "text" | "headers" | "screenshot";
  content?: string;
  screenshotFile?: File;
  attachmentFile?: File;
}

export interface AnalyzeEmailResult {
  report: EmailAnalysisReport;
  savedId?: string;
}

/** Uses XMLHttpRequest (not fetch) so screenshot uploads can report real progress, same pattern as resumeScanService.ts. */
export function analyzeEmail(input: AnalyzeEmailInput, onProgress?: (percent: number) => void): Promise<AnalyzeEmailResult> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("inputMethod", input.inputMethod);
    if (input.content) formData.append("content", input.content);
    if (input.screenshotFile) formData.append("screenshot", input.screenshotFile);
    if (input.attachmentFile) formData.append("attachment", input.attachmentFile);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE_URL}/api/email/analyze`);

    const token = getAuthToken();
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      let body: { report?: EmailAnalysisReport; savedId?: string; error?: string } | null = null;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        // Non-JSON response — handled by the generic error below.
      }

      if (xhr.status >= 200 && xhr.status < 300 && body?.report) {
        resolve({ report: body.report, savedId: body.savedId });
      } else {
        reject(new Error(body?.error ?? "Something went wrong analyzing this email. Please try again."));
      }
    };

    xhr.onerror = () => reject(new Error("Couldn't reach the analysis service. Make sure the backend server is running."));
    xhr.ontimeout = () => reject(new Error("The request timed out. Please try again."));

    xhr.send(formData);
  });
}

export async function exportEmailReportPdf(report: EmailAnalysisReport): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/api/email/export`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify({ report }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "Something went wrong generating that PDF.");
  }

  return response.blob();
}
