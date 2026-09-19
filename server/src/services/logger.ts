/**
 * Minimal structured logger. Swap the transport (e.g. to a file or a
 * hosted logging service) without touching call sites — every call
 * goes through info/warn/error below.
 */
function timestamp() {
  return new Date().toISOString();
}

function format(level: string, message: string, context?: object) {
  const base = `[${timestamp()}] [${level}] ${message}`;
  return context ? `${base} ${JSON.stringify(context)}` : base;
}

export const logger = {
  info(message: string, context?: object) {
    console.log(format("INFO", message, context));
  },
  warn(message: string, context?: object) {
    console.warn(format("WARN", message, context));
  },
  /** Use for third-party API failures so they're easy to grep for during debugging. */
  error(message: string, context?: object) {
    console.error(format("ERROR", message, context));
  },
};
