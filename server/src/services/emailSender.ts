import { env } from "../config/env";
import { logger } from "./logger";
import { fetchWithTimeout } from "../utils/fetchWithTimeout";

const RESEND_TIMEOUT_MS = 8000;

// Resend's shared sandbox sender — works without owning/verifying a
// custom domain, which fits a small project like this. Real production
// use would eventually verify a real domain, but that's an unnecessary
// hurdle for getting password reset working at all.
const FROM_ADDRESS = "CyberSentinel <onboarding@resend.dev>";

export interface SendResetEmailResult {
  sent: boolean;
  /** Present when sending failed or was skipped, for logging — never shown to the end user (would leak whether an email exists). */
  reason?: string;
}

export async function sendPasswordResetEmail(toEmail: string, resetUrl: string): Promise<SendResetEmailResult> {
  if (!env.RESEND_API_KEY) {
    return { sent: false, reason: "RESEND_API_KEY not configured" };
  }

  try {
    const response = await fetchWithTimeout(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM_ADDRESS,
          to: [toEmail],
          subject: "Reset your CyberSentinel password",
          html: buildResetEmailHtml(resetUrl),
        }),
      },
      RESEND_TIMEOUT_MS
    );

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      logger.error("Resend API returned an error response", { status: response.status, body });
      return { sent: false, reason: `Resend API responded with ${response.status}` };
    }

    return { sent: true };
  } catch (error) {
    logger.error("Failed to send password reset email", { error: String(error) });
    return { sent: false, reason: String(error) };
  }
}

function buildResetEmailHtml(resetUrl: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
      <h2 style="margin-bottom: 8px;">Reset your password</h2>
      <p>Someone requested a password reset for your CyberSentinel account. If this was you, click the link below — it expires in 30 minutes.</p>
      <p style="margin: 24px 0;">
        <a href="${resetUrl}" style="background: #4F7CFF; color: white; padding: 12px 20px; border-radius: 8px; text-decoration: none; display: inline-block;">Reset Password</a>
      </p>
      <p style="color: #666; font-size: 13px;">If you didn't request this, you can safely ignore this email — your password won't change unless you click the link above and set a new one.</p>
    </div>
  `;
}
