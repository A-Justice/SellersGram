const MESSAGES: Record<string, string> = {
  "auth/operation-not-allowed":
    "That sign-in method is not turned on yet. In Firebase: Authentication → Sign-in method → enable Email/Password, Google, and/or Phone.",
  "auth/invalid-credential": "Wrong email or password.",
  "auth/invalid-email": "That email does not look right.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/user-not-found": "No account with that email. Create one first.",
  "auth/wrong-password": "Wrong email or password.",
  "auth/email-already-in-use": "That email already has an account. Sign in instead.",
  "auth/weak-password": "Use at least 6 characters for the password.",
  "auth/popup-closed-by-user": "Google sign-in was closed.",
  "auth/popup-blocked": "The browser blocked the Google popup. Allow popups and try again.",
  "auth/unauthorized-domain":
    "This domain is not allowed. Add it under Authentication → Settings → Authorized domains.",
  "auth/invalid-phone-number": "That phone number does not look right.",
  "auth/missing-phone-number": "Enter a phone number.",
  "auth/quota-exceeded": "Too many SMS requests. Try again later.",
  "auth/too-many-requests": "Too many attempts. Wait a bit and try again.",
  "auth/code-expired": "That code expired. Request a new one.",
  "auth/invalid-verification-code": "Wrong code. Check the SMS and try again.",
  "auth/missing-verification-code": "Enter the 6-digit code from SMS.",
  "auth/session-expired": "This sign-in session expired. Request a new code.",
  "auth/captcha-check-failed": "Security check failed. Refresh the page and try again.",
};

export function authErrorMessage(err: unknown) {
  if (err instanceof Error && !/auth\//i.test(err.message)) {
    // Local validation messages (e.g. phone formatting)
    if (
      err.message.startsWith("Enter") ||
      err.message.startsWith("Use a") ||
      err.message.startsWith("Request")
    ) {
      return err.message;
    }
  }

  const raw = err instanceof Error ? err.message : "Could not sign in";
  const match = raw.match(/auth\/[a-z0-9-]+/i);
  if (match) {
    const code = match[0].toLowerCase();
    if (MESSAGES[code]) return MESSAGES[code];
  }
  return raw.replace(/^Firebase:\s*/i, "").replace(/\s*\(auth\/[^)]+\)\.?$/, "");
}
