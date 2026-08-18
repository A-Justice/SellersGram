const MESSAGES: Record<string, string> = {
  "auth/operation-not-allowed":
    "Email or Google sign-in is not turned on yet. In Firebase: Authentication → Sign-in method → enable Email/Password and Google.",
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
};

export function authErrorMessage(err: unknown) {
  const raw = err instanceof Error ? err.message : "Could not sign in";
  const match = raw.match(/auth\/[a-z0-9-]+/i);
  if (match) {
    const code = match[0].toLowerCase();
    if (MESSAGES[code]) return MESSAGES[code];
  }
  return raw.replace(/^Firebase:\s*/i, "").replace(/\s*\(auth\/[^)]+\)\.?$/, "");
}
