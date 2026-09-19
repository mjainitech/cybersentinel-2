import * as tls from "node:tls";
import { logger } from "./logger";
import type { ScanCheckResult } from "../types";

interface HttpsAndSslResult {
  https: ScanCheckResult;
  ssl: ScanCheckResult;
}

/**
 * Opens a real TLS connection to the host and reads the peer
 * certificate directly — no third-party API needed. Verifies both
 * that HTTPS works and how healthy the certificate is (expiry).
 */
export async function getHttpsAndSslChecks(url: string, hostname: string): Promise<HttpsAndSslResult> {
  const httpsBase: Omit<ScanCheckResult, "status" | "value" | "summary"> = {
    id: "https",
    title: "HTTPS Enabled",
  };
  const sslBase: Omit<ScanCheckResult, "status" | "value" | "summary"> = {
    id: "ssl-certificate",
    title: "SSL Certificate Status",
  };

  if (!url.startsWith("https://")) {
    return {
      https: {
        ...httpsBase,
        status: "danger",
        value: "Not detected",
        summary: "This site doesn't use HTTPS — avoid entering passwords or payment details.",
      },
      ssl: {
        ...sslBase,
        status: "unknown",
        value: "Skipped",
        summary: "SSL certificate check skipped because the site isn't served over HTTPS.",
      },
    };
  }

  try {
    const cert = await connectAndGetCertificate(hostname);
    const expiresAt = new Date(cert.valid_to);
    const daysUntilExpiry = Math.round((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    const sslStatus = daysUntilExpiry < 0 ? "danger" : daysUntilExpiry < 14 ? "warning" : "safe";
    const sslValue =
      daysUntilExpiry < 0
        ? `Expired ${Math.abs(daysUntilExpiry)} day(s) ago`
        : `Valid · expires in ${daysUntilExpiry} days`;
    const sslSummary =
      sslStatus === "danger"
        ? "This site's SSL certificate has expired."
        : sslStatus === "warning"
        ? "This site's SSL certificate expires soon — worth checking back."
        : "The certificate is issued by a trusted authority and hasn't expired.";

    return {
      https: {
        ...httpsBase,
        status: "safe",
        value: "Enabled",
        summary: "Traffic to this site is encrypted in transit.",
      },
      ssl: { ...sslBase, status: sslStatus, value: sslValue, summary: sslSummary },
    };
  } catch (error) {
    logger.error("HTTPS/SSL check failed", { hostname, error: String(error) });
    return {
      https: {
        ...httpsBase,
        status: "unknown",
        value: "Unavailable",
        summary: "Could not verify the HTTPS connection for this site.",
      },
      ssl: {
        ...sslBase,
        status: "unknown",
        value: "Unavailable",
        summary: "Could not verify the SSL certificate for this site.",
      },
    };
  }
}

function connectAndGetCertificate(hostname: string, timeoutMs = 6000): Promise<tls.PeerCertificate> {
  return new Promise((resolve, reject) => {
    const socket = tls.connect(
      { host: hostname, port: 443, servername: hostname, timeout: timeoutMs },
      () => {
        const cert = socket.getPeerCertificate();
        socket.end();
        if (!cert || !cert.valid_to) {
          reject(new Error("No certificate returned by host"));
        } else {
          resolve(cert);
        }
      }
    );

    socket.on("timeout", () => {
      socket.destroy();
      reject(new Error("TLS connection timed out"));
    });
    socket.on("error", reject);
  });
}
