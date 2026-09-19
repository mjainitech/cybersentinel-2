import { authHeader, getAuthToken } from "@/services/authToken";

export type PiiCategory =
  | "phone"
  | "email"
  | "address"
  | "linkedin"
  | "github"
  | "portfolio"
  | "personal-website"
  | "date-of-birth"
  | "government-id"
  | "sensitive-other";

export interface DetectedPiiItem {
  category: PiiCategory;
  label: string;
  value: string;
}

export type PrivacyRating = "excellent" | "good" | "needs-improvement" | "high-risk";

export interface ResumeRecommendation {
  id: string;
  text: string;
  reason: string;
  priority: "low" | "medium" | "high";
}

export interface ResumeAiReview {
  summary: string;
  foundInfo: string[];
  risks: string[];
  recommendations: string[];
  generatedByAi: boolean;
}

export interface ResumePrivacyReport {
  fileName: string;
  analyzedAt: string;
  privacyScore: number;
  privacyRating: PrivacyRating;
  detected: DetectedPiiItem[];
  recommendations: ResumeRecommendation[];
  aiReview: ResumeAiReview;
  lowTextWarning: boolean;
}

export const PII_CATEGORY_LABELS: Record<PiiCategory, string> = {
  phone: "Phone Number",
  email: "Email Address",
  address: "Home Address",
  linkedin: "LinkedIn Profile",
  github: "GitHub Profile",
  portfolio: "Portfolio / Project Link",
  "personal-website": "Personal Website",
  "date-of-birth": "Date of Birth",
  "government-id": "Government ID Number",
  "sensitive-other": "Other Sensitive Information",
};

export const PRIVACY_RATING_LABELS: Record<PrivacyRating, string> = {
  excellent: "Excellent",
  good: "Good",
  "needs-improvement": "Needs Improvement",
  "high-risk": "High Risk",
};

/** Stages shown while a resume is being analyzed. */
export const RESUME_ANALYSIS_STAGES = [
  "Uploading resume...",
  "Extracting text...",
  "Scanning for personal information...",
  "Generating privacy review...",
];

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8787";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // Mirrors the backend default; the backend is authoritative.

export function validateResumeFile(file: File): string | null {
  const isPdfType = file.type === "application/pdf";
  const isPdfExtension = file.name.toLowerCase().endsWith(".pdf");

  if (!isPdfType || !isPdfExtension) {
    return "Please upload a PDF file — other formats aren't supported yet.";
  }
  if (file.size === 0) {
    return "That file appears to be empty.";
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `That file is too large. Please upload a PDF under ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.`;
  }
  return null;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export interface AnalyzeResumeResult {
  report: ResumePrivacyReport;
  /** Present only if the caller was signed in — used to enable "export" / "view in history" afterward. */
  savedId?: string;
}

/**
 * Uploads and analyzes a resume PDF. Uses XMLHttpRequest rather than
 * fetch specifically because fetch has no upload-progress event —
 * onProgress lets the UI show a real progress bar instead of a fake one.
 */
export function analyzeResume(file: File, onProgress: (percent: number) => void): Promise<AnalyzeResumeResult> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("resume", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE_URL}/api/resume/analyze`);

    const token = getAuthToken();
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      let body: { report?: ResumePrivacyReport; savedId?: string; error?: string } | null = null;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        // Non-JSON response — handled by the generic error below.
      }

      if (xhr.status >= 200 && xhr.status < 300 && body?.report) {
        resolve({ report: body.report, savedId: body.savedId });
      } else {
        reject(new Error(body?.error ?? "Something went wrong analyzing your resume. Please try again."));
      }
    };

    xhr.onerror = () => reject(new Error("Couldn't reach the scanning service. Make sure the backend server is running."));
    xhr.ontimeout = () => reject(new Error("The upload timed out. Please try again."));

    xhr.send(formData);
  });
}

/** Downloads a PDF export directly from a report object — works even for guests with no saved history. */
export async function exportResumeReportPdf(report: ResumePrivacyReport): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/api/resume/export`, {
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

/** Triggers a browser download for a Blob — small shared helper since export is offered in a couple of places. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
