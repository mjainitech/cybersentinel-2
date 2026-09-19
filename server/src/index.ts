import express from "express";
import cors from "cors";
import { env, logConfigWarnings } from "./config/env";
import { logger } from "./services/logger";
import { scanRouter } from "./routes/scan";
import { authRouter } from "./routes/auth";
import { scanHistoryRouter } from "./routes/scanHistory";
import { resumeRouter } from "./routes/resume";
import { emailRouter } from "./routes/email";
import { passwordRouter } from "./routes/password";
import { breachRouter } from "./routes/breach";
import { securityCenterRouter } from "./routes/securityCenter";
import { learningRouter } from "./routes/learning";
import { threatsRouter } from "./routes/threats";
import { analyticsRouter } from "./routes/analytics";
import { aiCoachRouter } from "./routes/aiCoach";
import { actionCenterRouter } from "./routes/actionCenter";
import { errorHandler } from "./middleware/errorHandler";
import { ensureSchema } from "./services/dbPostgres";

const app = express();

app.use(cors({ origin: env.FRONTEND_ORIGIN }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api", scanRouter);
app.use("/api/auth", authRouter);
app.use("/api/scans", scanHistoryRouter);
app.use("/api/resume", resumeRouter);
app.use("/api/email", emailRouter);
app.use("/api/password", passwordRouter);
app.use("/api/breach", breachRouter);
app.use("/api/security-center", securityCenterRouter);
app.use("/api/learning", learningRouter);
app.use("/api/threats", threatsRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/ai-coach", aiCoachRouter);
app.use("/api/action-center", actionCenterRouter);

// Must be registered last — Express only treats a 4-arg handler as an error middleware.
app.use(errorHandler);

app.listen(env.PORT, () => {
  logger.info(`CyberSentinel API listening on port ${env.PORT}`);
  logConfigWarnings(logger);

  if (env.DATABASE_URL) {
    ensureSchema()
      .then(() => logger.info("Connected to persistent database — accounts will survive restarts."))
      .catch((error) => logger.error("Database schema setup failed at boot", { error: String(error) }));
  }
});

// Never let an unexpected rejection or exception take the whole process down —
// log it and keep serving. In a real deployment, pair this with a process
// manager (pm2, systemd, a container orchestrator) that restarts on repeated failure.
process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", { reason: String(reason) });
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception", { error: error.message });
});
