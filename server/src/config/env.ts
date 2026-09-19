import "dotenv/config";
import crypto from "node:crypto";

/**
 * Loads and centralizes environment variables. API keys live ONLY
 * here on the backend and are never sent to or read by the frontend.
 * Missing keys don't crash the server — each service checks for its
 * own key and degrades to an "unknown" check result if absent
 * (see services/*.ts), so the app stays usable even with a partial
 * .env during local development.
 */
function optional(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value.trim() : undefined;
}

function withDefault(name: string, fallback: string): string {
  return optional(name) ?? fallback;
}

export const env = {
  PORT: Number(withDefault("PORT", "8787")),
  FRONTEND_ORIGIN: withDefault("FRONTEND_ORIGIN", "http://localhost:5173"),

  VIRUSTOTAL_API_KEY: optional("VIRUSTOTAL_API_KEY"),
  URLSCAN_API_KEY: optional("URLSCAN_API_KEY"),
  WHOIS_API_KEY: optional("WHOIS_API_KEY"),
  IP_GEOLOCATION_API_KEY: optional("IP_GEOLOCATION_API_KEY"),
  ANTHROPIC_API_KEY: optional("ANTHROPIC_API_KEY"),
  HIBP_API_KEY: optional("HIBP_API_KEY"),
  NVD_API_KEY: optional("NVD_API_KEY"),

  // Persistent Postgres connection string (e.g. from Neon). Without this,
  // user accounts fall back to the local JSON file store, which does NOT
  // survive a restart on hosts with an ephemeral filesystem (like Render's
  // free tier) — accounts would silently disappear after every spin-down.
  DATABASE_URL: optional("DATABASE_URL"),

  // Resend API key for sending password-reset emails. Without this, the
  // forgot-password flow still generates a valid reset token but cannot
  // actually deliver it — see services/emailSender.ts for the fallback.
  RESEND_API_KEY: optional("RESEND_API_KEY"),

  // Falls back to a random secret generated at boot rather than crashing —
  // this just means existing sessions won't survive a restart until a
  // real JWT_SECRET is set in .env. Fine for local dev, not for production.
  JWT_SECRET: withDefault("JWT_SECRET", crypto.randomBytes(32).toString("hex")),
  JWT_SECRET_WAS_GENERATED: !optional("JWT_SECRET"),

  CACHE_TTL_MS: Number(withDefault("CACHE_TTL_MINUTES", "15")) * 60 * 1000,
  REQUEST_TIMEOUT_MS: Number(withDefault("REQUEST_TIMEOUT_MS", "6000")),
  RESUME_MAX_FILE_SIZE_MB: Number(withDefault("RESUME_MAX_FILE_SIZE_MB", "5")),
};

/** Logged once at boot so missing keys are obvious without crashing anything. */
export function logConfigWarnings(logger: { warn: (msg: string, ctx?: object) => void }) {
  if (env.JWT_SECRET_WAS_GENERATED) {
    logger.warn(
      "JWT_SECRET is not set — using a random secret generated at boot. Existing login sessions will be invalidated every time the server restarts until you set a real JWT_SECRET in .env."
    );
  }

  const keys: Array<[string, string | undefined]> = [
    ["VIRUSTOTAL_API_KEY", env.VIRUSTOTAL_API_KEY],
    ["URLSCAN_API_KEY", env.URLSCAN_API_KEY],
    ["WHOIS_API_KEY", env.WHOIS_API_KEY],
    ["IP_GEOLOCATION_API_KEY", env.IP_GEOLOCATION_API_KEY],
    ["ANTHROPIC_API_KEY", env.ANTHROPIC_API_KEY],
    ["HIBP_API_KEY", env.HIBP_API_KEY],
    ["DATABASE_URL", env.DATABASE_URL],
    ["RESEND_API_KEY", env.RESEND_API_KEY],
  ];

  for (const [name, value] of keys) {
    if (!value) {
      const consequence =
        name === "ANTHROPIC_API_KEY"
          ? "the AI explanation will fall back to a template-based summary until it's configured."
          : name === "HIBP_API_KEY"
          ? "the Data Breach Checker cannot run until it's configured — there's no fallback for this one, since a breach check without real data would be misleading."
          : name === "DATABASE_URL"
          ? "accounts will fall back to local file storage, which does NOT survive a restart on most hosts — logins will appear to randomly stop working until this is set."
          : name === "RESEND_API_KEY"
          ? "password reset requests will generate a valid link but cannot email it to the user until this is set."
          : "related checks will report as \"unknown\" until it's configured.";
      logger.warn(`${name} is not set — ${consequence}`);
    }
  }
}
