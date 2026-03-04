/**
 * Structured JSON logger for Convex backend functions.
 *
 * Emits single-line JSON to console.info/console.error which surfaces
 * in the Convex dashboard logs. Only two levels: info and error.
 */

type LogEvent = Record<string, unknown>;

export const logger = {
  info(event: LogEvent): void {
    console.info(JSON.stringify(event));
  },

  error(event: LogEvent): void {
    console.error(JSON.stringify(event));
  },
};

const MAX_STRING_LENGTH = 200;

/** Truncate strings over MAX_STRING_LENGTH to keep events compact. */
function truncateValue(value: unknown): unknown {
  if (typeof value === "string" && value.length > MAX_STRING_LENGTH) {
    return `${value.slice(0, MAX_STRING_LENGTH)}...[truncated]`;
  }
  if (Array.isArray(value)) {
    return value.map(truncateValue);
  }
  if (value !== null && typeof value === "object") {
    return sanitizeArgs(value as Record<string, unknown>);
  }
  return value;
}

/** Sanitize function args for logging by truncating long strings. */
export function sanitizeArgs(args: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(args)) {
    sanitized[key] = truncateValue(value);
  }
  return sanitized;
}
