import { authErrorMessage, isAuthPersistenceClosingError } from "@/lib/auth-errors";

/** Messages we already wrote for humans — pass through unchanged. */
function looksFriendly(message: string) {
  if (!message || message.length > 180) return false;
  if (/^Firebase:/i.test(message)) return false;
  if (/^[A-Z_]+$/.test(message)) return false; // ADMIN_ONLY_OPERATION, etc.
  if (/failed to fetch|networkerror|load failed|network request failed/i.test(message)) {
    return false;
  }
  if (/auth\/[a-z0-9-]+/i.test(message)) return false;
  return true;
}

/**
 * Turn raw SDK / browser errors into short, calm copy for the UI.
 * Prefer specific guidance when we recognize the failure mode.
 */
export function userFacingError(
  err: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (isAuthPersistenceClosingError(err)) {
    return authErrorMessage(err);
  }

  const raw =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : fallback;
  const message = raw.replace(/^Firebase:\s*/i, "").trim() || fallback;

  if (/auth\/[a-z0-9-]+/i.test(message)) {
    return authErrorMessage(err);
  }

  if (
    /failed to fetch|networkerror|load failed|network request failed|fetch failed/i.test(
      message,
    )
  ) {
    return "We couldn’t reach the server. Check your internet connection and try again.";
  }

  if (/timeout|timed out|abort/i.test(message)) {
    return "That took too long. Check your connection and try again.";
  }

  if (/offline|internet|ERR_INTERNET|ERR_CONNECTION|ERR_NAME_NOT_RESOLVED/i.test(message)) {
    return "You appear to be offline. Reconnect and try again.";
  }

  if (/not signed in|invalid session|sign in to /i.test(message)) {
    return "Please sign in again, then try once more.";
  }

  if (/permission-denied|missing or insufficient permissions/i.test(message)) {
    return "You don’t have permission to do that. Sign in again or contact support.";
  }

  if (/quota|resource-exhausted|too many/i.test(message)) {
    return "Things are a bit busy right now. Wait a moment and try again.";
  }

  if (/413|too large|entity too large/i.test(message)) {
    return "Those photos are too large. Try fewer or smaller images.";
  }

  if (looksFriendly(message)) return message;

  return fallback;
}
